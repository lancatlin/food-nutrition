import asyncio
import json
from datetime import datetime, timezone
from database import get_db
from deps import get_current_user
from fastapi import APIRouter, Depends, HTTPException, Query
from models import Ingredient, Recipe, RecipeIngredient, SavedRecipe, User
from pydantic import BaseModel, Field
from recipe_client import get_recipes as fetch_recipes
from services.usda_nutrition import get_all_recipes_nutrition
from sqlalchemy.orm import Session

router = APIRouter(prefix="/recipes", tags=["recipes"])


# Schemas

class RecipeRequest(BaseModel):
    ingredients: list[str] = Field(
        ..., examples=[["mushrooms", "cabbage", "soy sauce"]]
    )


class RecipeIngredientOut(BaseModel):
    id: int
    ingredient_name: str

    class Config:
        from_attributes = True


class RecipeOut(BaseModel):
    id: int
    recipe_name: str
    diet_label: str | None
    image_path: str | None
    recipe_instructions: str | None
    nutrition_json: str | None

    class Config:
        from_attributes = True


class RecipeDetailOut(BaseModel):
    id: int
    recipe_name: str
    diet_label: str | None
    image_path: str | None
    recipe_instructions: str | None
    nutrition_json: str | None
    ingredients: list[RecipeIngredientOut]

    class Config:
        from_attributes = True


class GenerateRecipeResponse(BaseModel):
    ingredients_used: list[str]
    generated_recipe: RecipeOut
    nutrition: dict


class SaveRecipeResponse(BaseModel):
    message: str
    recipe_id: int


# Helpers

def _get_ingredient(db: Session, name: str) -> Ingredient | None:
    """
    Look up an ingredient by name only — never create one.
    Returns None if the ingredient doesn't exist in the DB.
    """
    clean = name.strip().lower()
    return db.query(Ingredient).filter(Ingredient.name == clean).first()


def _save_recipe_to_db(
    db: Session,
    recipe_data: dict,
    nutrition_data: dict,
) -> Recipe:
    """
    Persist a single generated recipe to the database.
    Only links ingredients that already exist in the ingredient table.
    """
    instructions = recipe_data.get("method", "")
    if isinstance(instructions, list):
        instructions = "\n".join(instructions)

    recipe = Recipe(
        recipe_name=recipe_data.get("title", "Untitled Recipe"),
        diet_label=recipe_data.get("diet_label"),
        image_path=recipe_data.get("image_path"),
        recipe_instructions=instructions,
        nutrition_json=json.dumps(nutrition_data.get("recipe_per_100g", {})),
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
    )
    db.add(recipe)
    db.flush()

    for ing_name in recipe_data.get("ingredients", []):
        ingredient = _get_ingredient(db, ing_name)
        if ingredient:
            db.add(RecipeIngredient(
                recipe_id=recipe.id,
                ingredient_id=ingredient.id,
            ))

    db.flush()
    return recipe


# GET /recipes

@router.get("", response_model=list[RecipeOut])
def get_recipes(
    i: list[str] = Query(None, description="List of ingredients to match"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    With ingredients (?i=chicken&i=garlic) — return recipes from the DB
    whose ingredients are a subset of the provided list.
    Without ingredients — return the current user's saved recipes.
    """
    if i:
        input_ingredients = {name.strip().lower() for name in i}
        matched_ingredient_rows = (
            db.query(Ingredient)
            .filter(Ingredient.name.in_(input_ingredients))
            .all()
        )
        matched_ids = {ing.id for ing in matched_ingredient_rows}

        if not matched_ids:
            return []

        result = []
        for recipe in db.query(Recipe).all():
            recipe_ingredient_ids = {ri.ingredient_id for ri in recipe.ingredients}
            if recipe_ingredient_ids and recipe_ingredient_ids.issubset(matched_ids):
                result.append(recipe)
        return result

    else:
        return (
            db.query(Recipe)
            .join(SavedRecipe, SavedRecipe.recipe_id == Recipe.id)
            .filter(SavedRecipe.user_id == current_user.id)
            .all()
        )


# POST /recipes

@router.post("", response_model=GenerateRecipeResponse, status_code=201)
async def create_recipe(
    request: RecipeRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Step 1 — Send ingredient list to AI microservice, get 1 recipe back.
    Step 2 — Fetch USDA nutrition for that recipe.
    Step 3 — Save recipe to DB, linking only existing ingredients.
    Step 4 — Return recipe with its DB ID and nutrition data.
    """
    # Step 1 — generate 1 recipe via AI
    generated = await fetch_recipes(
        ingredients=request.ingredients,
        num_recipes=1,
    )

    if not generated or generated[0].get("parse_error"):
        raise HTTPException(
            status_code=502,
            detail="AI service failed to generate a valid recipe.",
        )

    recipe_data = generated[0]

    # Step 2 — fetch USDA nutrition
    nutrition_list = await asyncio.to_thread(get_all_recipes_nutrition, [recipe_data])
    nutrition_data = nutrition_list[0] if nutrition_list else {}

    # Step 3 — save to DB
    saved_recipe = _save_recipe_to_db(db, recipe_data, nutrition_data)
    db.commit()
    db.refresh(saved_recipe)

    # Step 4 — return result
    return GenerateRecipeResponse(
        ingredients_used=request.ingredients,
        generated_recipe=RecipeOut(
            id=saved_recipe.id,
            recipe_name=saved_recipe.recipe_name,
            diet_label=saved_recipe.diet_label,
            image_path=saved_recipe.image_path,
            recipe_instructions=saved_recipe.recipe_instructions,
            nutrition_json=saved_recipe.nutrition_json,
        ),
        nutrition=nutrition_data,
    )


# GET /recipes/{id}

@router.get("/{recipe_id}", response_model=RecipeDetailOut)
def get_recipe(
    recipe_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Return full details of a single recipe including its ingredient list."""
    recipe = db.query(Recipe).filter(Recipe.id == recipe_id).first()
    if not recipe:
        raise HTTPException(status_code=404, detail="Recipe not found")

    return RecipeDetailOut(
        id=recipe.id,
        recipe_name=recipe.recipe_name,
        diet_label=recipe.diet_label,
        image_path=recipe.image_path,
        recipe_instructions=recipe.recipe_instructions,
        nutrition_json=recipe.nutrition_json,
        ingredients=[
            RecipeIngredientOut(
                id=ri.id,
                ingredient_name=ri.ingredient.name,
            )
            for ri in recipe.ingredients
        ],
    )


# POST /recipes/{id}/save

@router.post("/{recipe_id}/save", response_model=SaveRecipeResponse, status_code=201)
def save_recipe(
    recipe_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Save a recipe to the current user's collection."""
    recipe = db.query(Recipe).filter(Recipe.id == recipe_id).first()
    if not recipe:
        raise HTTPException(status_code=404, detail="Recipe not found")

    existing = (
        db.query(SavedRecipe)
        .filter(
            SavedRecipe.recipe_id == recipe_id,
            SavedRecipe.user_id == current_user.id,
        )
        .first()
    )
    if existing:
        raise HTTPException(status_code=409, detail="Recipe already saved")

    db.add(SavedRecipe(
        user_id=current_user.id,
        recipe_id=recipe_id,
        saved_at=datetime.now(timezone.utc),
    ))
    db.commit()

    return SaveRecipeResponse(
        message="Recipe saved successfully",
        recipe_id=recipe_id,
    )