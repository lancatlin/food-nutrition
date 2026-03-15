import asyncio

from fastapi import APIRouter
from pydantic.fields import Field
from pydantic.main import BaseModel
from recipe_client import get_recipes
from services.usda_nutrition import get_all_recipes_nutrition
from services.nutrition_evaluation import get_nutrition_explanation

router = APIRouter(prefix="/recipes", tags=["recipes"])


class NutritionRequest(BaseModel):
    ingredients: list[str] = Field(
        ..., examples=[["mushrooms", "cabbage", "soy sauce"]]
    )
    num_recipes: int = Field(default=1, ge=1, le=10)


class NutritionResponse(BaseModel):
    ingredients_used: list[str]
    recipes: list[dict]


@router.post("", response_model=NutritionResponse)
async def create_recipes(request: NutritionRequest):
    """
    End-user endpoint. Pipeline:
        Step 1 — AI microservice generates recipes from ingredients
        Step 2 — USDA API fetches nutritional data for each valid recipe
        Step 3 — Gemini generates a health summary for each recipe
        Step 4 — Each recipe, its nutrition, and summary are merged into one object
    """
    # ── Step 1: Generate recipes via AI microservice ───────────────────────────
    recipes = await get_recipes(
        ingredients=request.ingredients,
        num_recipes=request.num_recipes,
    )

    # ── Step 2: Fetch USDA nutrition for valid recipes ─────────────────────────
    # get_all_recipes_nutrition() is blocking — run in thread pool
    nutrition_list = await asyncio.to_thread(get_all_recipes_nutrition, recipes)

    # Build a lookup dict keyed by recipe title for easy merging
    nutrition_by_title = {n["title"]: n for n in nutrition_list}

    # ── Step 3 & 4: Generate summary and merge everything per recipe ───────────
    merged_recipes = []

    for recipe in recipes:
        if recipe.get("parse_error"):
            merged_recipes.append(recipe)
            continue

        title = recipe["title"]
        nutrition = nutrition_by_title.get(title, {})

        # Generate health summary — run in thread pool as Gemini is blocking
        summary = await asyncio.to_thread(get_nutrition_explanation, nutrition)

        merged_recipes.append({
            "title":       title,
            "ingredients": recipe.get("ingredients", []),
            "method":      recipe.get("method", []),
            "validation":  recipe.get("validation", {}),
            "nutrition": {
                "total_weight_g":        nutrition.get("total_weight_g", 0),
                "recipe_per_100g":       nutrition.get("recipe_per_100g", {}),
                "ingredients_not_found": nutrition.get("ingredients_not_found", []),
                "ingredients":           nutrition.get("ingredients", []),
                "summary":               summary,
            },
        })

    # ── Step 5: Return combined result ────────────────────────────────────────
    return NutritionResponse(
        ingredients_used=request.ingredients,
        recipes=merged_recipes,
    )