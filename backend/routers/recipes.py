import asyncio

from database import get_db
from deps import get_current_user
from fastapi import APIRouter, Depends
from models import Recipe, User
from pydantic.fields import Field
from pydantic.main import BaseModel
from recipe_client import get_recipes
from services.usda_nutrition import get_all_recipes_nutrition
from sqlalchemy import select
from sqlalchemy.orm import Session

router = APIRouter(prefix="/recipes", tags=["recipes"])


class RecipeRequest(BaseModel):
    ingredients: list[str] = Field(
        ..., examples=[["mushrooms", "cabbage", "soy sauce"]]
    )
    num_recipes: int = Field(default=3, ge=1, le=10)


class RecipeResponse(BaseModel):
    ingredients_used: list[str]
    recipes: list[dict]
    nutrition: list[dict]


@router.get("")
async def get_recipes(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    stmt = select(Recipe).where(Recipe.user_id == current_user.id)
    return list(db.scalars(stmt))


@router.post("", response_model=RecipeResponse)
async def create_recipes(
    request: RecipeRequest,
    current_user: User = Depends(get_current_user),
):
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
    return RecipeResponse(
        ingredients_used=request.ingredients,
        recipes=recipes,
        nutrition=nutrition,
    )
