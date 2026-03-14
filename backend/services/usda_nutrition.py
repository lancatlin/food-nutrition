"""
USDA FoodData Central — Nutrition Lookup
Outputs structured JSON nutrition data per ingredient and per recipe.

Setup:
    1. Get a free API key at: https://fdc.nal.usda.gov/api-key-signup/
       (instant — just an email address required)
    2. Set your key:
           export USDA_API_KEY="your_key_here"
       Or paste it into the API_KEY line below.

Install:
    pip install requests

Usage (standalone):
    python usda_nutrition.py

Usage (integrated with recipe_generator.py):
    from usda_nutrition import get_recipe_nutrition
    result = get_recipe_nutrition(recipe)   # returns a dict
    import json; print(json.dumps(result, indent=2))
"""

import json
import os
import re
import requests
from pathlib import Path
from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parent.parent / ".env.dev")

# ── Credentials ────────────────────────────────────────────────────────────────
API_KEY  = os.getenv("USDA_KEY")   # ← or paste key here
BASE_URL = "https://api.nal.usda.gov/fdc/v1"

# ── Unit → grams conversion table ────────────────────────────────────────────
# Approximate weights used to convert recipe quantities to grams so we can
# compute a weighted per-100g nutrition figure for the whole recipe.
UNIT_TO_GRAMS = {
    # weight
    "gram": 1.0,   "grams": 1.0,   "g": 1.0,
    "kilogram": 1000.0, "kilograms": 1000.0, "kg": 1000.0,
    "ounce": 28.35, "ounces": 28.35, "oz": 28.35,
    "pound": 453.59, "pounds": 453.59, "lb": 453.59,
    # volume (water-density approximation)
    "milliliter": 1.0, "milliliters": 1.0, "ml": 1.0,
    "liter": 1000.0,   "liters": 1000.0,   "l": 1000.0,
    "cup": 240.0,  "cups": 240.0,
    "tablespoon": 15.0, "tablespoons": 15.0, "tbsp": 15.0,
    "teaspoon": 5.0,   "teaspoons": 5.0,    "tsp": 5.0,
    # loose whole items (rough averages)
    "clove": 5.0,   "cloves": 5.0,
    "slice": 30.0,  "slices": 30.0,
    "piece": 50.0,  "pieces": 50.0,
    "bunch": 100.0, "bunches": 100.0,
    "handful": 30.0,
    "pinch": 0.3,
    "dash": 0.6,
    "small": 80.0,
    "medium": 130.0,
    "large": 200.0,
}

# Fraction character map
FRAC_MAP = {"½": 0.5, "¼": 0.25, "¾": 0.75, "⅓": 1/3, "⅔": 2/3}

# ── Food-specific whole-item weights (grams) ──────────────────────────────────
# Used when an ingredient has no standard unit (e.g. "1/4 cabbage", "2 eggs").
# Each entry is the realistic weight of ONE whole item. Source: avg supermarket weights.
FOOD_ITEM_WEIGHTS = {
    # Vegetables
    "cabbage":          900.0,  "red cabbage":      900.0,
    "onion":            150.0,  "red onion":        150.0,
    "white onion":      150.0,  "brown onion":      150.0,
    "shallot":           30.0,
    "garlic":           100.0,  # whole bulb; "cloves" unit takes priority
    "potato":           170.0,  "sweet potato":     200.0,
    "carrot":            80.0,  "parsnip":          120.0,
    "beetroot":         100.0,  "turnip":           150.0,
    "zucchini":         200.0,  "courgette":        200.0,
    "eggplant":         300.0,  "aubergine":        300.0,
    "capsicum":         160.0,  "bell pepper":      160.0,
    "chili":             15.0,  "chilli":            15.0,
    "tomato":           120.0,  "cherry tomato":     20.0,
    "cucumber":         300.0,
    "celery stalk":      40.0,  "celery":            40.0,
    "leek":             180.0,
    "broccoli":         400.0,  "cauliflower":      600.0,
    "lettuce":          300.0,  "iceberg lettuce":  500.0,
    "spinach":           30.0,  "kale":              30.0,
    "mushroom":          18.0,  "mushrooms":         18.0,
    "corn":             150.0,  "corn cob":         150.0,
    "pumpkin":         1000.0,  "butternut squash": 800.0,
    "asparagus spear":   20.0,  "asparagus":         20.0,
    # Fruits
    "apple":            182.0,  "pear":             178.0,
    "banana":           118.0,  "orange":           130.0,
    "mandarin":          88.0,  "lemon":            100.0,
    "lime":              67.0,  "grapefruit":       230.0,
    "peach":            150.0,  "plum":              66.0,
    "apricot":           35.0,  "mango":            200.0,
    "kiwi":              76.0,  "strawberry":        12.0,
    "grape":              5.0,  "avocado":          150.0,
    # Proteins
    "egg":               60.0,  "eggs":              60.0,
    "chicken breast":   175.0,  "chicken thigh":    115.0,
    "chicken drumstick": 85.0,
    "salmon fillet":    150.0,  "tuna steak":       150.0,
}

# Sorted longest-first so "bell pepper" matches before "pepper"
_FOOD_KEYS_SORTED = sorted(FOOD_ITEM_WEIGHTS.keys(), key=len, reverse=True)


def _food_specific_weight(ingredient_name: str) -> float | None:
    """Return the per-item gram weight for a recognised whole food, or None."""
    name_lower = re.sub(r"\(.*?\)", "", ingredient_name.lower()).strip()
    for key in _FOOD_KEYS_SORTED:
        if key in name_lower:
            return FOOD_ITEM_WEIGHTS[key]
    return None


def _scan_for_unit(ingredient_name: str) -> float | None:
    """
    Scan every word in the ingredient string for a recognised unit.
    Longer unit names are checked first (e.g. "tablespoons" before "table").
    Returns grams-per-unit or None.
    """
    text = ingredient_name.lower()
    for unit in sorted(UNIT_TO_GRAMS.keys(), key=len, reverse=True):
        if re.search(r"\b" + re.escape(unit) + r"\b", text):
            return UNIT_TO_GRAMS[unit]
    return None


def parse_quantity_grams(ingredient_name: str) -> float:
    """
    Parse the leading quantity + unit from an ingredient string and return
    the equivalent weight in grams.

    Resolution order:
      1. First word after the number is a known unit  → quantity × unit_grams
         e.g. "1 tablespoon olive oil"  → 1 × 15g = 15g
      2. Any word anywhere in the string is a known unit (handles "3 garlic cloves")
         e.g. "3 garlic cloves"  → 3 × 5g (cloves) = 15g
      3. Food-specific whole-item weight table
         e.g. "1/4 cabbage"  → 0.25 × 900g = 225g
      4. Generic medium-item fallback (130g) if food not in table.

    Returns 0.0 when no leading number is found (e.g. "salt and pepper to taste").
    """
    s = ingredient_name.strip()
    for char, val in FRAC_MAP.items():
        s = s.replace(char, str(val))

    pattern = re.compile(
        r"^(\d+(?:\.\d+)?)"
        r"(?:\s*/\s*(\d+(?:\.\d+)?))?"
        r"(?:\s+(\d+(?:\.\d+)?)"
        r"\s*/\s*(\d+(?:\.\d+)?))?"
        r"\s*([a-zA-Z]+)?",
        re.IGNORECASE,
    )
    m = pattern.match(s)
    if not m:
        return 0.0

    a, b, c, d, first_word = m.groups()
    quantity = float(a)
    if b:
        quantity = float(a) / float(b)
    if c and d:
        quantity += float(c) / float(d)

    # Priority 1: immediate unit word
    first_unit = (first_word or "").lower().strip()
    if first_unit in UNIT_TO_GRAMS:
        return round(quantity * UNIT_TO_GRAMS[first_unit], 2)

    # Priority 2: unit word anywhere in string
    grams_per_unit = _scan_for_unit(ingredient_name)
    if grams_per_unit is not None:
        return round(quantity * grams_per_unit, 2)

    # Priority 3: food-specific weight, then generic fallback
    food_weight = _food_specific_weight(ingredient_name)
    per_item_g  = food_weight if food_weight is not None else UNIT_TO_GRAMS["medium"]
    return round(quantity * per_item_g, 2)

# USDA nutrient IDs for the fields we care about
NUTRIENT_IDS = {
    "calories_kcal": 1008,
    "fat_g":         1004,
    "carbs_g":       1005,
    "protein_g":     1003,
    "fiber_g":       1079,
    "sugar_g":       2000,
}

# Preferred data types in priority order (Foundation/SR Legacy = best per-100g data)
PREFERRED_DATA_TYPES = ["Foundation", "SR Legacy", "Survey (FNDDS)", "Branded"]


# ── API helpers ────────────────────────────────────────────────────────────────
def _post(endpoint: str, body: dict) -> dict:
    """
    POST to USDA FDC with a JSON body.
    The api_key is passed as a query param (required even for POST requests).
    dataType must be a JSON array — this is the correct format per the API docs.
    """
    resp = requests.post(
        f"{BASE_URL}/{endpoint}",
        params={"api_key": API_KEY},
        json=body,                                     # sends Content-Type: application/json
        timeout=10,
    )
    resp.raise_for_status()
    return resp.json()


def search_food(query: str) -> dict | None:
    """
    Search FoodData Central for `query`.
    Prefers Foundation > SR Legacy > Survey > Branded for reliable per-100g values.
    Returns the best matching food dict, or None if nothing found.
    """
    data = _post("foods/search", {
        "query":    query,
        "dataType": ["Foundation", "SR Legacy", "Survey (FNDDS)"],  # must be a list
        "pageSize": 10,
    })

    foods = data.get("foods", [])
    if not foods:
        return None

    for preferred in PREFERRED_DATA_TYPES:
        for food in foods:
            if food.get("dataType", "") == preferred:
                return food

    return foods[0]


def extract_nutrient(food: dict, nutrient_id: int) -> float:
    """Pull a specific nutrient value (per 100 g) from a food search result."""
    for n in food.get("foodNutrients", []):
        if n.get("nutrientId") == nutrient_id:
            try:
                return round(float(n.get("value", 0) or 0), 2)
            except (ValueError, TypeError):
                return 0.0
    return 0.0


# ── Core lookup ────────────────────────────────────────────────────────────────
def lookup_ingredient(ingredient_name: str) -> dict:
    """
    Search USDA FDC for `ingredient_name`.
    Strips leading quantities/units before searching.

    Returns a dict:
    {
        "ingredient":   original name as supplied,
        "matched_food": USDA description string (or null),
        "data_type":    USDA data type (or null),
        "per_100g": {
            "calories_kcal": float,
            "fat_g":         float,
            "carbs_g":       float,
            "protein_g":     float,
            "fiber_g":       float,
            "sugar_g":       float
        },
        "found": bool,
        "error": str or null
    }
    """
    # Step 1 — strip leading quantity + unit
    #   handles: "150 grams", "1/4", "1/2 teaspoon", fraction chars, etc.
    clean_name = re.sub(
        r"^\s*"
        r"(\d+\s*/\s*\d+|[\d½¼¾⅓⅔]+)"
        r"(\s*\d+/\d+)?"
        r"\s*"
        r"(grams?|g|kilograms?|kg|ounces?|oz|pounds?|lb"
        r"|cups?|tablespoons?|tbsp|teaspoons?|tsp"
        r"|milliliters?|ml|liters?|l"
        r"|cloves?|slices?|pieces?|medium|large|small"
        r"|bunch(?:es)?|handful|pinch|dash)?"
        r"\s*",
        "",
        ingredient_name,
        flags=re.IGNORECASE,
    ).strip()

    # Step 2 — remove parenthetical preparation notes e.g. "(sliced)", "(optional)"
    clean_name = re.sub(r"\(.*?\)", "", clean_name).strip()

    # Step 3 — keep only the base ingredient before any comma
    clean_name = clean_name.split(",")[0].strip()

    # Step 4 — drop filler words that confuse the USDA search
    clean_name = re.sub(
        r"\b(to\s+taste|optional|fresh|dried|raw|cooked|frozen|chopped"
        r"|diced|minced|sliced|shredded|grated|crushed|ground|and)\b",
        "",
        clean_name,
        flags=re.IGNORECASE,
    ).strip()

    # Step 5 — collapse any double spaces left by removals
    clean_name = re.sub(r"\s{2,}", " ", clean_name).strip()

    try:
        food = search_food(clean_name)

        if not food:
            return {
                "ingredient":   ingredient_name,
                "matched_food": None,
                "data_type":    None,
                "per_100g":     {k: 0.0 for k in NUTRIENT_IDS},
                "found":        False,
                "error":        "Not found in USDA database",
            }

        return {
            "ingredient":   ingredient_name,
            "matched_food": food.get("description", clean_name),
            "data_type":    food.get("dataType", ""),
            "per_100g": {
                key: extract_nutrient(food, nid)
                for key, nid in NUTRIENT_IDS.items()
            },
            "found": True,
            "error": None,
        }

    except requests.HTTPError as e:
        body = ""
        if e.response is not None:
            try:
                body = e.response.json()
            except Exception:
                body = e.response.text
        return {
            "ingredient":   ingredient_name,
            "matched_food": None,
            "data_type":    None,
            "per_100g":     {k: 0.0 for k in NUTRIENT_IDS},
            "found":        False,
            "error":        f"HTTP {getattr(e.response, 'status_code', '?')}: {body}",
        }


# ── Public interface ───────────────────────────────────────────────────────────
def get_recipe_nutrition(recipe: dict) -> dict:
    """
    Given a recipe dict from recipe_generator.generate_recipes(), fetch
    USDA nutrition for every ingredient, then compute recipe_per_100g —
    the blended nutritional value of the whole recipe per 100g.

    How recipe_per_100g is calculated:
        1. Parse each ingredient string to get its weight in grams.
        2. For each nutrient: actual_amount = (weight_g / 100) * nutrient_per_100g
        3. Sum actual amounts across all ingredients → total nutrient in recipe.
        4. Scale to per-100g basis: (total_nutrient / total_weight_g) * 100

    Returns a structured dict:
    {
        "title":           str,
        "total_weight_g":  float,     ← total parsed weight of all ingredients
        "recipe_per_100g": {          ← weighted nutritional blend of the whole recipe
            "calories_kcal": float,
            "fat_g":         float,
            "carbs_g":       float,
            "protein_g":     float,
            "fiber_g":       float,
            "sugar_g":       float
        },
        "ingredients_not_found": [str, ...]   ← ingredients the USDA could not match
    }
    """
    title = recipe.get("title", "Untitled Recipe")
    raw_ingredients = recipe.get("ingredients", [])

    # Normalise to plain strings
    if raw_ingredients and isinstance(raw_ingredients[0], dict):
        ingredient_names = [
            f"{item.get('amount', '')} {item.get('name', '')}".strip()
            for item in raw_ingredients
        ]
    else:
        ingredient_names = [str(i) for i in raw_ingredients]

    print(f"\nFetching nutrition for: {title}")

    results = []
    not_found = []

    for ing in ingredient_names:
        print(f"  → {ing} ...", end=" ", flush=True)
        data = lookup_ingredient(ing)

        # Parse weight even if lookup failed — so we can log it
        weight_g = parse_quantity_grams(ing)
        data["weight_g"] = weight_g

        results.append(data)

        if data["found"]:
            print(
                f"✓  {data['matched_food']} [{data['data_type']}]"
                + (f"  ({weight_g}g)" if weight_g else "  (weight unknown)")
            )
        else:
            print(f"✗  {data['error']}")
            not_found.append(ing)

    # ── Weighted recipe_per_100g calculation ───────────────────────────────────
    # Only include ingredients that were both found AND have a known weight.
    total_weight_g = 0.0
    weighted_totals = {k: 0.0 for k in NUTRIENT_IDS}

    for item in results:
        if item["found"] and item["weight_g"] > 0:
            w = item["weight_g"]
            total_weight_g = round(total_weight_g + w, 2)
            for key in NUTRIENT_IDS:
                # actual nutrient in this ingredient = (weight/100) * per_100g_value
                weighted_totals[key] = round(
                    weighted_totals[key] + (w / 100.0) * item["per_100g"][key], 4
                )

    # Scale to per-100g of the combined recipe
    if total_weight_g > 0:
        recipe_per_100g = {
            key: round((weighted_totals[key] / total_weight_g) * 100, 2)
            for key in NUTRIENT_IDS
        }
    else:
        recipe_per_100g = {k: 0.0 for k in NUTRIENT_IDS}

    print(f"  Total recipe weight (parsed): {total_weight_g}g")

    return {
        "title":                 title,
        "total_weight_g":        total_weight_g,
        "recipe_per_100g":       recipe_per_100g,
        "ingredients_not_found": not_found,
        "ingredients": results
    }


# ── Batch interface ───────────────────────────────────────────────────────────
def get_all_recipes_nutrition(recipes: list[dict]) -> list[dict]:
    """
    Accept the full JSON list output from recipe_generator.generate_recipes(),
    skip any entries with parse_error=True, and return a nutrition dict for
    each valid recipe.

    Parameters
    ----------
    recipes : list of recipe dicts as returned by generate_recipes().
              Each valid recipe must have at least "title" and "ingredients".
              Dicts containing "parse_error": true are silently skipped.

    Returns
    -------
    List of nutrition dicts as returned by get_recipe_nutrition(), one per
    valid recipe. Parse-error recipes are excluded entirely from the output.

    Example
    -------
    from recipe_generator import generate_recipes
    from usda_nutrition import get_all_recipes_nutrition

    recipes   = generate_recipes(["mushrooms", "cabbage", "honey"])
    nutrition = get_all_recipes_nutrition(recipes)
    """
    valid_recipes   = [r for r in recipes if not r.get("parse_error")]
    skipped         = len(recipes) - len(valid_recipes)

    if skipped:
        print(f"⚠  Skipping {skipped} recipe(s) with parse errors.")

    if not valid_recipes:
        print("No valid recipes to process.")
        return []

    print(f"Processing {len(valid_recipes)} valid recipe(s)...\n")

    return [get_recipe_nutrition(recipe) for recipe in valid_recipes]


# ── Entry point ────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    # Standalone test — supply a recipe list directly (no HF model needed)
    sample_recipes = [
        {
            "title": "Sauteed Mushrooms and Cabbage",
            "ingredients": [
                "200g mushrooms (sliced)",
                "1/2 cabbage (shredded)",
                "1 tablespoon olive oil",
                "1/2 teaspoon honey",
                "1/4 teaspoon soy sauce",
                "salt and pepper to taste",
                "1 tablespoon sesame seeds (optional)",
            ],
        },
        {
            "parse_error": True,
            "raw": "truncated output...",
        },
    ]

    results = get_all_recipes_nutrition(sample_recipes)
    print(json.dumps(results, indent=2))