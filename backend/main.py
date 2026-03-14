import asyncio
from fastapi import FastAPI
from pydantic import BaseModel, Field
from database import engine, Base
import models

from recipe_client import get_recipes
from services.usda_nutrition import get_all_recipes_nutrition

app = FastAPI(title="Food Nutrition App")

@app.on_event("startup")
def create_tables():
    Base.metadata.create_all(bind=engine)


# ── Schemas ────────────────────────────────────────────────────────────────────

class NutritionRequest(BaseModel):
    ingredients: list[str] = Field(..., examples=[["mushrooms", "cabbage", "soy sauce"]])
    num_recipes: int = Field(default=3, ge=1, le=10)


class NutritionResponse(BaseModel):
    ingredients_used: list[str]
    recipes: list[dict]
    nutrition: list[dict]


# ── Routes ─────────────────────────────────────────────────────────────────────

@app.post("/recipes", response_model=NutritionResponse)
async def create_recipes(request: NutritionRequest):
    """
    End-user endpoint. Mirrors the original main.py pipeline:
        Step 1 — AI microservice generates recipes from ingredients
        Step 2 — USDA API fetches nutritional data for each valid recipe
        Step 3 — Combined result returned to the frontend
    """
    # ── Step 1: Generate recipes via AI microservice ───────────────────────────
    recipes = await get_recipes(
        ingredients=request.ingredients,
        num_recipes=request.num_recipes,
    )

    # ── Step 2: Fetch USDA nutrition for valid recipes ─────────────────────────
    # get_all_recipes_nutrition() is a blocking/synchronous function (uses requests).
    # We run it in a thread pool so it doesn't block FastAPI's async event loop.
    nutrition = await asyncio.to_thread(get_all_recipes_nutrition, recipes)

    # ── Step 3: Return combined result ────────────────────────────────────────
    return NutritionResponse(
        ingredients_used=request.ingredients,
        recipes=recipes,
        nutrition=nutrition,
    )