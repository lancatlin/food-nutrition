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
API_KEY  = "DP1x8jbCGbJcajZ0ZM7Jg6wm2qwl5rWdz3lEZ4jR"
BASE_URL = "https://api.nal.usda.gov/fdc/v1"

# ── Hardcoded nutrition overrides ──────────────────────────────────────────────
# For ingredients where the USDA search consistently returns wrong results,
# we skip the API and return known correct values directly.
# Keys are matched as whole words against the cleaned ingredient name.
# Sorted longest-first so "black pepper" matches before "pepper",
# and "chicken breast" matches before "chicken".
NUTRITION_OVERRIDES = {
    # Plain water has no nutritional value
    "water": {
        "calories_kcal": 0.0,   "fat_g": 0.0,   "carbs_g": 0.0,
        "protein_g": 0.0,       "fiber_g": 0.0,  "sugar_g": 0.0,
    },
    # Salt has no macronutrient value in cooking amounts
    "salt": {
        "calories_kcal": 0.0,   "fat_g": 0.0,   "carbs_g": 0.0,
        "protein_g": 0.0,       "fiber_g": 0.0,  "sugar_g": 0.0,
    },
    # Ground black pepper — USDA often returns banana pepper instead
    "black pepper": {
        "calories_kcal": 251.0, "fat_g": 3.26,  "carbs_g": 64.0,
        "protein_g": 10.4,      "fiber_g": 25.3, "sugar_g": 0.64,
    },
    # White pepper
    "white pepper": {
        "calories_kcal": 296.0, "fat_g": 2.12,  "carbs_g": 68.6,
        "protein_g": 10.4,      "fiber_g": 26.2, "sugar_g": 0.0,
    },
    # Generic "pepper" (spice) — default to black pepper values.
    # NOTE: "bell pepper" is excluded via _OVERRIDE_BLOCKERS below.
    "pepper": {
        "calories_kcal": 251.0, "fat_g": 3.26,  "carbs_g": 64.0,
        "protein_g": 10.4,      "fiber_g": 25.3, "sugar_g": 0.64,
    },
    # Olive oil — Foundation data often returns 0 calories incorrectly
    "olive oil": {
        "calories_kcal": 884.0, "fat_g": 100.0, "carbs_g": 0.0,
        "protein_g": 0.0,       "fiber_g": 0.0,  "sugar_g": 0.0,
    },
    # Vegetable oil
    "vegetable oil": {
        "calories_kcal": 884.0, "fat_g": 100.0, "carbs_g": 0.0,
        "protein_g": 0.0,       "fiber_g": 0.0,  "sugar_g": 0.0,
    },
    # Chicken breast — USDA often returns pork loin or Abiyuch instead
    "chicken breast": {
        "calories_kcal": 165.0, "fat_g": 3.6,   "carbs_g": 0.0,
        "protein_g": 31.0,      "fiber_g": 0.0,  "sugar_g": 0.0,
    },
    # Spinach — USDA often returns drumstick leaves instead
    "spinach": {
        "calories_kcal": 23.0,  "fat_g": 0.39,  "carbs_g": 3.63,
        "protein_g": 2.86,      "fiber_g": 2.2,  "sugar_g": 0.42,
    },
    # Coconut milk — USDA often returns unrelated canned items
    "coconut milk": {
        "calories_kcal": 230.0, "fat_g": 23.8,  "carbs_g": 5.54,
        "protein_g": 2.29,      "fiber_g": 2.2,  "sugar_g": 3.34,
    },
    # Shredded coconut — USDA often returns coconut water instead
    "shredded coconut": {
        "calories_kcal": 660.0, "fat_g": 64.5,  "carbs_g": 23.7,
        "protein_g": 6.88,      "fiber_g": 16.3, "sugar_g": 7.44,
    },
    # Carrot — USDA consistently returns dehydrated carrot instead of raw
    "carrot": {
        "calories_kcal": 41.0,  "fat_g": 0.24,  "carbs_g": 9.58,
        "protein_g": 0.93,      "fiber_g": 2.8,  "sugar_g": 4.74,
    },
    # Brown rice (cooked) — USDA returns raw flour instead
    "brown rice": {
        "calories_kcal": 216.0, "fat_g": 1.8,   "carbs_g": 44.8,
        "protein_g": 5.0,       "fiber_g": 3.5,  "sugar_g": 0.0,
    },
    # Plain rice (cooked) — USDA returns inconsistent results
    # NOTE: "brown rice" is excluded via _OVERRIDE_BLOCKERS below.
    "rice": {
        "calories_kcal": 206.0, "fat_g": 0.44,  "carbs_g": 44.5,
        "protein_g": 4.25,      "fiber_g": 0.6,  "sugar_g": 0.0,
    },
}

# These ingredient words, when present, block a shorter override key from matching.
# e.g. "bell" blocks "pepper" from matching "bell pepper".
# e.g. "brown" blocks "rice" from matching "brown rice" (caught by "brown rice" entry first).
# Structure: { override_key: [blocking_words] }
_OVERRIDE_BLOCKERS = {
    "pepper":       ["bell"],
    "white pepper": ["bell"],
    "rice":         ["brown"],
}

# Sort overrides longest-first so "black pepper" matches before "pepper",
# "chicken breast" matches before "chicken", "shredded coconut" before "coconut milk", etc.
_OVERRIDE_KEYS_SORTED = sorted(NUTRITION_OVERRIDES.keys(), key=len, reverse=True)

# ── Unit → grams conversion table ─────────────────────────────────────────────
UNIT_TO_GRAMS = {
    # weight
    "gram": 1.0,        "grams": 1.0,        "g": 1.0,
    "kilogram": 1000.0, "kilograms": 1000.0, "kg": 1000.0,
    "ounce": 28.35,     "ounces": 28.35,     "oz": 28.35,
    "pound": 453.59,    "pounds": 453.59,    "lb": 453.59,
    # volume (water-density approximation)
    "milliliter": 1.0,  "milliliters": 1.0,  "ml": 1.0,
    "liter": 1000.0,    "liters": 1000.0,    "l": 1000.0,
    "cup": 240.0,       "cups": 240.0,
    "tablespoon": 15.0, "tablespoons": 15.0, "tbsp": 15.0,
    "teaspoon": 5.0,    "teaspoons": 5.0,    "tsp": 5.0,
    # cans
    "can": 400.0,       "cans": 400.0,
    # loose whole items (rough averages)
    "clove": 5.0,       "cloves": 5.0,
    "slice": 30.0,      "slices": 30.0,
    "piece": 50.0,      "pieces": 50.0,
    "bunch": 100.0,     "bunches": 100.0,
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
FOOD_ITEM_WEIGHTS = {
    # Vegetables
    "cabbage":          900.0,  "red cabbage":      900.0,
    "onion":            150.0,  "red onion":        150.0,
    "white onion":      150.0,  "brown onion":      150.0,
    "shallot":           30.0,
    "garlic":           100.0,
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
    the equivalent weight in grams. Handles no-space units like "400g", "500ml".
    """
    s = ingredient_name.strip()
    for char, val in FRAC_MAP.items():
        s = s.replace(char, str(val))

    # Extended pattern: handles both "400 g" and "400g" (no space between number and unit)
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

    first_unit = (first_word or "").lower().strip()
    if first_unit in UNIT_TO_GRAMS:
        return round(quantity * UNIT_TO_GRAMS[first_unit], 2)

    grams_per_unit = _scan_for_unit(ingredient_name)
    if grams_per_unit is not None:
        return round(quantity * grams_per_unit, 2)

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

PREFERRED_DATA_TYPES = ["Foundation", "SR Legacy", "Survey (FNDDS)", "Branded"]


# ── API helpers ────────────────────────────────────────────────────────────────
def _post(endpoint: str, body: dict) -> dict:
    resp = requests.post(
        f"{BASE_URL}/{endpoint}",
        params={"api_key": API_KEY},
        json=body,
        timeout=10,
    )
    resp.raise_for_status()
    return resp.json()


def search_food(query: str) -> dict | None:
    data = _post("foods/search", {
        "query":    query,
        "dataType": ["Foundation", "SR Legacy", "Survey (FNDDS)"],
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
    for n in food.get("foodNutrients", []):
        if n.get("nutrientId") == nutrient_id:
            try:
                return round(float(n.get("value", 0) or 0), 2)
            except (ValueError, TypeError):
                return 0.0
    return 0.0


def _check_override(clean_name: str) -> str | None:
    """
    Check if the cleaned ingredient name matches a hardcoded override.
    Returns the matching override key, or None if no match.

    Uses longest-first matching and blocker words to prevent false matches
    e.g. "pepper" must not match "bell pepper".
    e.g. "rice" must not match "brown rice" (caught by "brown rice" entry first).
    """
    clean_lower = clean_name.lower()

    for override_key in _OVERRIDE_KEYS_SORTED:
        if not re.search(r"\b" + re.escape(override_key) + r"\b", clean_lower):
            continue

        # Check if any blocker word is present that invalidates this match
        blockers = _OVERRIDE_BLOCKERS.get(override_key, [])
        if any(re.search(r"\b" + re.escape(b) + r"\b", clean_lower) for b in blockers):
            continue

        return override_key

    return None


# ── Core lookup ────────────────────────────────────────────────────────────────
def lookup_ingredient(ingredient_name: str) -> dict:
    """
    Search USDA FDC for `ingredient_name`.
    Checks hardcoded overrides first before hitting the API, preventing
    common mismatches (e.g. water → Water convolvulus, salt → Salted butter,
    bell pepper → black pepper spice values, carrot → dehydrated carrot).
    """
    # Step 1 — strip leading quantity + unit.
    # Handles both "400 g" (space) and "400g" (no space) via the inline unit pattern.
    clean_name = re.sub(
        r"^\s*"
        r"(\d+\s*/\s*\d+|[\d½¼¾⅓⅔]+(?:\.\d+)?)"
        r"(?:[gG]|[kK][gG]|[mM][lL](?!\w))?"   # no-space unit: 400g, 500ml, 1kg
        r"(\s*\d+/\d+)?"
        r"\s*"
        r"(grams?|g|kilograms?|kg|ounces?|oz|pounds?|lb"
        r"|cups?|tablespoons?|tbsp|teaspoons?|tsp"
        r"|milliliters?|ml|liters?|l"
        r"|cloves?|slices?|pieces?|medium|large|small"
        r"|bunch(?:es)?|handful|pinch|dash|cans?)?"
        r"\s*",
        "",
        ingredient_name,
        flags=re.IGNORECASE,
    ).strip()

    # Step 2 — remove parenthetical preparation notes e.g. "(sliced)", "(400ml)"
    clean_name = re.sub(r"\(.*?\)", "", clean_name).strip()

    # Step 3 — keep only the base ingredient before any comma
    clean_name = clean_name.split(",")[0].strip()

    # Step 4 — drop filler words that confuse the USDA search
    clean_name = re.sub(
        r"\b(to\s+taste|optional|fresh|dried|raw|cooked|frozen|chopped"
        r"|diced|minced|sliced|shredded|grated|crushed|ground|and"
        r"|light|lite|reduced.fat|low.sodium|boneless|skinless"
        r"|thinly|finely|roughly|any\s+color|for\s+serving"
        r"|whole\s+grain|long.grain|unsweetened|cut\s+into\s+\w+)\b",
        "",
        clean_name,
        flags=re.IGNORECASE,
    ).strip()

    # Step 5 — collapse double spaces
    clean_name = re.sub(r"\s{2,}", " ", clean_name).strip()

    # ── Override check ─────────────────────────────────────────────────────────
    override_key = _check_override(clean_name)
    if override_key:
        print(f"[Override] '{clean_name}' → '{override_key}'")
        return {
            "ingredient":   ingredient_name,
            "matched_food": override_key.title(),
            "data_type":    "Override",
            "per_100g":     NUTRITION_OVERRIDES[override_key],
            "found":        True,
            "error":        None,
        }

    # ── USDA API lookup ────────────────────────────────────────────────────────
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
    USDA nutrition for every ingredient, then compute recipe_per_100g.
    """
    title = recipe.get("title", "Untitled Recipe")
    raw_ingredients = recipe.get("ingredients", [])

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

    total_weight_g = 0.0
    weighted_totals = {k: 0.0 for k in NUTRIENT_IDS}

    for item in results:
        if item["found"] and item["weight_g"] > 0:
            w = item["weight_g"]
            total_weight_g = round(total_weight_g + w, 2)
            for key in NUTRIENT_IDS:
                weighted_totals[key] = round(
                    weighted_totals[key] + (w / 100.0) * item["per_100g"][key], 4
                )

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
        "ingredients":           results,
    }


# ── Batch interface ────────────────────────────────────────────────────────────
def get_all_recipes_nutrition(recipes: list[dict]) -> list[dict]:
    """
    Accept the full list from generate_recipes(), skip parse errors,
    and return nutrition for each valid recipe.
    """
    valid_recipes = [r for r in recipes if not r.get("parse_error")]
    skipped       = len(recipes) - len(valid_recipes)

    if skipped:
        print(f"⚠  Skipping {skipped} recipe(s) with parse errors.")

    if not valid_recipes:
        print("No valid recipes to process.")
        return []

    print(f"Processing {len(valid_recipes)} valid recipe(s)...\n")

    return [get_recipe_nutrition(recipe) for recipe in valid_recipes]


# ── Entry point ────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    sample_recipes = [
        {
            "title": "Test Recipe",
            "ingredients": [
                "400g boneless, skinless chicken breast, cut into bite-sized pieces",
                "1 carrot, chopped",
                "1 bell pepper, chopped",
                "2 cups cooked long-grain rice",
                "3 cups cooked brown rice",
                "1/2 cup unsweetened shredded coconut",
                "1 can reduced-fat coconut milk",
                "1 cup spinach leaves",
                "1/2 teaspoon salt",
                "1/4 teaspoon black pepper",
                "1 tablespoon olive oil",
                "1 cup (250ml) water",
            ],
        },
    ]

    results = get_all_recipes_nutrition(sample_recipes)
    print(json.dumps(results, indent=2))