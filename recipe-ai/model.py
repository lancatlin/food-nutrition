import json
import re
import torch
from transformers import AutoTokenizer, AutoModelForCausalLM, pipeline

MODEL_NAME = "Ashikan/dut-recipe-generator"

# Kitchen staples that are always permitted regardless of user input
KITCHEN_STAPLES = {
    ""
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
    """
    Attempt to close a truncated JSON string so it can be parsed.

    Strategy:
      1. Strip any trailing incomplete token (mid-word, mid-string, mid-number).
      2. Close any open string literal with a closing quote.
      3. Close open arrays and objects in the reverse order they were opened.
    """
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
    """
    Extract and parse the JSON object from the model's raw output.
    Private — only called internally by generate_recipes().
    """
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


def _validate_ingredients(recipe_ingredients: list[str], user_ingredients: list[str]) -> dict:
    """
    Check that every recipe ingredient is covered by the user's list or kitchen staples.
    Private — only called internally by generate_recipes().
    """
    allowed = {ing.lower().strip() for ing in user_ingredients} | KITCHEN_STAPLES

    extra = []
    for ing in recipe_ingredients:
        ing_lower = ing.lower().strip()
        if not any(
            allowed_item in ing_lower or ing_lower in allowed_item
            for allowed_item in allowed
        ):
            extra.append(ing)

    return {"valid": len(extra) == 0, "extra_ingredients": extra}


def _normalise_ingredients(recipe_ingredients: list) -> list[str]:
    """
    Flatten the model's ingredient list to plain strings.
    Private — only called internally by generate_recipes().
    """
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

    Called by the /generate endpoint in main.py.
    """
    if _model_pipe is None:
        raise RuntimeError("Model not loaded. Ensure load_model() was called at startup.")

    input_text = '{"prompt": ' + json.dumps(ingredients)

    print(f"Input ingredients : {', '.join(ingredients)}")
    print(f"Generating {num_recipes} recipes on {DEVICE.upper()}...\n")

    recipes = []

    for i in range(num_recipes):
        print(f"Generating recipe {i + 1} / {num_recipes}...")

        output = _model_pipe(
            input_text,
            max_new_tokens=max_new_tokens,
            temperature=0.2 + i * 0.15,
            do_sample=True,
            truncation=True,
        )[0]["generated_text"]

        parsed = _parse_recipe_output(output)

        if parsed is None:
            print(f"  ⚠  Could not parse JSON from output.\n")
            recipes.append({"parse_error": True, "raw": output})
            continue

        ingredient_list = _normalise_ingredients(parsed.get("ingredients", []))
        validation = _validate_ingredients(ingredient_list, ingredients)

        result = {
            "title": parsed.get("title", f"Recipe {i + 1}"),
            "ingredients": ingredient_list,
            "method": parsed.get("method", ""),
            "validation": validation,
        }
        recipes.append(result)
        print(f"  ✓  '{result['title']}' — {len(ingredient_list)} ingredients parsed.")

    return recipes