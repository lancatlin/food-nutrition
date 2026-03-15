import json
import re
import torch
from transformers import AutoTokenizer, AutoModelForCausalLM, pipeline, GenerationConfig
import time

MODEL_NAME = "Ashikan/dut-recipe-generator"

# Kitchen staples that are always permitted regardless of user input.
# These are basic pantry/seasoning items that any kitchen is assumed to have.
KITCHEN_STAPLES = {
    "water", "salt", "black pepper", "white pepper", "pepper",
    "olive oil", "vegetable oil", "oil", "butter", "sugar",
    "flour", "cornstarch", "baking powder", "baking soda",
    "vinegar",
}

# Module-level singletons — loaded once at startup, reused for every request
_tokenizer = None
_model = None
_model_pipe = None

# Detect device once at module load — used by load_model() and generate_recipes()
DEVICE = "cuda" if torch.cuda.is_available() else "cpu"


def load_model():
    """
    Load the model, tokenizer, and pipeline into memory.
    Called ONCE during microservice startup via FastAPI's lifespan hook.
    Automatically runs on CUDA if available, otherwise falls back to CPU.
    """
    global _tokenizer, _model, _model_pipe

    print(f"Device detected: {DEVICE.upper()}")
    print(f"Loading model '{MODEL_NAME}'... (this may take a moment)")

    _tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)
    _model = AutoModelForCausalLM.from_pretrained(MODEL_NAME)

    # Move model to the detected device (GPU or CPU)
    _model = _model.to(DEVICE)
    _model.eval()

    _model_pipe = pipeline(
        "text-generation",
        model=_model,
        tokenizer=_tokenizer,
        device=0 if DEVICE == "cuda" else -1,  # 0 = first GPU, -1 = CPU
    )

    print(f"Model loaded and ready on {DEVICE.upper()}.")


# ── JSON helpers ───────────────────────────────────────────────────────────────

def _repair_truncated_json(s: str) -> str:
    s = s.rstrip()
    s = re.sub(r",\s*$", "", s)

    in_string = False
    i = 0
    while i < len(s):
        if s[i] == '\\':
            i += 2
            continue
        if s[i] == '"':
            in_string = not in_string
        i += 1

    if in_string:
        s += '"'

    s = re.sub(r",\s*$", "", s.rstrip())

    stack = []
    in_string = False
    i = 0
    while i < len(s):
        c = s[i]
        if c == '\\' and in_string:
            i += 2
            continue
        if c == '"':
            in_string = not in_string
        elif not in_string:
            if c in ('{', '['):
                stack.append('}' if c == '{' else ']')
            elif c in ('}', ']'):
                if stack and stack[-1] == c:
                    stack.pop()
        i += 1

    s += "".join(reversed(stack))
    return s


def _parse_recipe_output(raw_output: str) -> dict | None:
    match = re.search(r"\{.*", raw_output, re.DOTALL)
    if not match:
        return None

    candidate = match.group()

    try:
        return json.loads(candidate)
    except json.JSONDecodeError:
        pass

    try:
        repaired = _repair_truncated_json(candidate)
        return json.loads(repaired)
    except json.JSONDecodeError:
        return None


def _strip_quantity(ingredient_name: str) -> str:
    """
    Strip leading quantities, units, and preparation notes from an ingredient
    string so we can compare just the food name.

    e.g. "200 grams rice noodles (cooked)" → "rice noodles"
         "1/2 teaspoon black pepper"        → "black pepper"
         "2 cloves garlic, minced"          → "garlic"
    """
    s = ingredient_name.lower().strip()

    # Remove parenthetical notes e.g. "(sliced)", "(optional)"
    s = re.sub(r"\(.*?\)", "", s)

    # Remove everything after a comma e.g. "garlic, minced" → "garlic"
    s = s.split(",")[0]

    # Remove leading quantity + unit
    s = re.sub(
        r"^\s*"
        r"(\d+\s*/\s*\d+|[\d½¼¾⅓⅔]+(?:\.\d+)?)"
        r"(\s*\d+/\d+)?"
        r"\s*"
        r"(grams?|g|kilograms?|kg|ounces?|oz|pounds?|lb"
        r"|cups?|tablespoons?|tbsp|teaspoons?|tsp"
        r"|milliliters?|ml|liters?|l"
        r"|cloves?|slices?|pieces?|medium|large|small"
        r"|bunch(?:es)?|handful|pinch|dash|portions?|tbsps?|tsps?)?"
        r"\s*",
        "",
        s,
        flags=re.IGNORECASE,
    ).strip()

    # Remove preparation words
    s = re.sub(
        r"\b(fresh|dried|raw|cooked|frozen|chopped|diced|minced|sliced"
        r"|shredded|grated|crushed|ground|boneless|skinless|low.sodium"
        r"|reduced.fat|thinly|finely|roughly|optional|to\s+taste)\b",
        "",
        s,
        flags=re.IGNORECASE,
    ).strip()

    # Collapse extra spaces
    s = re.sub(r"\s{2,}", " ", s).strip()

    return s


def _is_allowed(recipe_ingredient: str, allowed_names: set[str]) -> bool:
    """
    Strict matching: a recipe ingredient is allowed only if its stripped name
    is an EXACT match (or a whole-word subset) of a user ingredient or staple.

    This prevents "rice" from matching "rice noodles" —
    the recipe ingredient must map directly to what the user has.

    Match rules (in order):
      1. Exact match:        "garlic" == "garlic"               ✓
      2. User item contains recipe item (whole words only):
                             user has "chicken breast",
                             recipe uses "chicken breast"       ✓
      3. Recipe item contains user item (whole words only):
                             user has "rice",
                             recipe uses "rice noodles"         ✗  ← blocked
                             recipe uses "brown rice"           ✓  ← allowed
    """
    stripped = _strip_quantity(recipe_ingredient)

    for allowed in allowed_names:
        if stripped == allowed:
            return True

        # allowed item is contained in the recipe ingredient as whole words
        # e.g. allowed="chicken breast", recipe="chicken breast fillets" → OK
        if re.search(r"\b" + re.escape(allowed) + r"\b", stripped):
            return True

        # recipe ingredient is contained in allowed item as whole words
        # e.g. allowed="chicken breast", recipe="chicken" → OK
        # but allowed="rice", recipe="rice noodles" → NOT OK (noodles is extra)
        if re.search(r"\b" + re.escape(stripped) + r"\b", allowed):
            # Make sure the recipe ingredient doesn't have extra significant words
            # beyond what the user supplied
            recipe_words = set(stripped.split())
            allowed_words = set(allowed.split())
            extra_words = recipe_words - allowed_words
            if not extra_words:
                return True

    return False


def _validate_ingredients(
    recipe_ingredients: list[str], user_ingredients: list[str]
) -> dict:
    """
    Check that every recipe ingredient is covered by the user's list or
    kitchen staples using strict whole-word matching.
    """
    # Build a set of stripped user ingredient names + staples
    allowed_names = {ing.lower().strip() for ing in user_ingredients} | KITCHEN_STAPLES

    extra = []
    for ing in recipe_ingredients:
        if not _is_allowed(ing, allowed_names):
            extra.append(ing)

    return {"valid": len(extra) == 0, "extra_ingredients": extra}


def _normalise_ingredients(recipe_ingredients: list) -> list[str]:
    if not recipe_ingredients:
        return []
    if isinstance(recipe_ingredients[0], dict):
        return [
            f"{item.get('amount', '')} {item.get('name', '')}".strip()
            for item in recipe_ingredients
        ]
    return [str(i) for i in recipe_ingredients]


# ── Public inference function ──────────────────────────────────────────────────

def generate_recipes(
    ingredients: list[str],
    num_recipes: int = 3,
    max_new_tokens: int = 1024,
) -> list[dict]:
    """
    Generate `num_recipes` recipes from the given ingredients.
    Requires load_model() to have been called first.
    Runs on whichever device was detected at startup (CUDA or CPU).

    The prompt explicitly instructs the model to use ONLY the provided
    ingredients plus basic kitchen staples, improving adherence.
    """
    if _model_pipe is None:
        raise RuntimeError("Model not loaded. Ensure load_model() was called at startup.")

    # Explicitly tell the model which ingredients it must restrict itself to
    staples_hint = ", ".join(sorted(KITCHEN_STAPLES))
    prompt_instruction = (
        f"Generate a recipe using ONLY these ingredients: {', '.join(ingredients)}. "
        f"You may also use these basic staples: {staples_hint}. "
        f"Do NOT use any ingredient not listed above. "
        f"If needed, use only a subset of the provided ingredients."
    )
    input_text = '{"prompt": ' + json.dumps(ingredients)

    print(f"Input ingredients : {', '.join(ingredients)}")
    print(f"Generating {num_recipes} recipes on {DEVICE.upper()}...\n")

    recipes = []
    seen_titles = set()

    start = time.perf_counter()

    MAX_PARSE_RETRIES = 2

    for i in range(num_recipes):
        print(f"Generating recipe {i + 1} / {num_recipes}...")

        parsed = None

        for attempt in range(MAX_PARSE_RETRIES + 1):
            if attempt > 0:
                print(f"  ↻ Retry {attempt}/{MAX_PARSE_RETRIES} — previous attempt failed to parse JSON.")

            output = _model_pipe(
                input_text,
                generation_config=GenerationConfig(
                    max_new_tokens=max_new_tokens,
                    temperature=0.7 + i * 0.2 + attempt * 0.1,
                    do_sample=True,
                ),
                truncation=True,
            )[0]["generated_text"]

            parsed = _parse_recipe_output(output)

            if parsed is not None:
                break  # Successfully parsed — stop retrying

        if parsed is None:
            print(f"  ⚠  Could not parse JSON after {MAX_PARSE_RETRIES + 1} attempts.\n")
            recipes.append({"parse_error": True, "raw": output})
            continue

        ingredient_list = _normalise_ingredients(parsed.get("ingredients", []))
        validation = _validate_ingredients(ingredient_list, ingredients)
        title = parsed.get("title", f"Recipe {i + 1}")

        if title.lower() in seen_titles:
            title = f"{title} ({len(recipes) + 1})"
        seen_titles.add(title.lower())

        result = {
            "title": title,
            "ingredients": ingredient_list,
            "method": parsed.get("method", ""),
            "validation": validation,
        }
        recipes.append(result)

        status = "✓" if validation["valid"] else "⚠ has extra ingredients"
        print(f"  {status}  '{result['title']}' — {len(ingredient_list)} ingredients parsed.")
        if not validation["valid"]:
            print(f"      Extra: {validation['extra_ingredients']}")
    
    end = time.perf_counter()
    print(f"\nGenerated {num_recipes} recipes in {end - start:.2f} seconds.")

    return recipes