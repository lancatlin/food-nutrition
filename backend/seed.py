"""
Seed the database with sample data for development.
Run from the backend/ directory: python seed.py
"""

import json
import sys
from datetime import date, datetime, timezone

from database import SessionLocal, engine, Base
from models import Ingredient, PantryItem, Recipe, RecipeIngredient, SavedRecipe, User

# ── Seed data ──────────────────────────────────────────────────────────────────

USERS = [
    {"email": "alice@example.com", "name": "Alice"},
    {"email": "bob@example.com", "name": "Bob"},
]

# Matches the shape produced by generate_recipes() in recipe-ai/model.py:
#   { title, ingredients: list[str], method: str, validation: {valid, extra_ingredients} }
RECIPES = [
    {
        "title": "Lentil Soup with Cumin & Coriander",
        "ingredients": [
            "4 cloves garlic, chopped",
            "1 small yellow onion, minced",
            "4 medium carrots, chopped",
            "4 celery stalks, chopped",
            "3 tbsp olive oil",
            "2 cups green or brown lentils, uncooked",
            "1 tsp cumin",
            "½ tsp coriander",
            "8 cups vegetable broth",
        ],
        "method": (
            "Heat olive oil in a large pot over medium heat. Sauté onion and garlic until softened. "
            "Add carrots, celery, and cumin. Cook for 3 minutes. "
            "Add lentils and vegetable broth. Bring to a boil. "
            "Reduce heat and simmer for 25–30 minutes until lentils are tender. "
            "Season with salt, pepper, and coriander. Serve warm."
        ),
        "diet_label": "Vegan",
        "health_label": "High-Fiber",
        "cuisine_type": "Mediterranean",
    },
    {
        "title": "Chicken Caesar Salad",
        "ingredients": [
            "2 chicken breasts, grilled and sliced",
            "1 head romaine lettuce, chopped",
            "50g parmesan cheese, shaved",
            "1 avocado, sliced",
            "Caesar dressing to taste",
            "Croutons (optional)",
        ],
        "method": (
            "Season and grill chicken breasts until cooked through. Rest and slice. "
            "Wash and chop romaine lettuce into bite-sized pieces. "
            "Toss lettuce with Caesar dressing. "
            "Top with chicken, avocado, parmesan, and croutons. "
            "Serve immediately."
        ),
        "diet_label": None,
        "health_label": "High-Protein",
        "cuisine_type": "American",
    },
    {
        "title": "Spinach & Bacon Omelette",
        "ingredients": [
            "3 large eggs",
            "2 strips bacon, diced",
            "1 cup fresh spinach",
            "¼ onion, diced",
            "Salt and pepper to taste",
            "1 tbsp butter",
        ],
        "method": (
            "Cook bacon in a non-stick pan until crispy. Set aside. "
            "In the same pan, sauté onion until translucent. "
            "Add spinach and cook until wilted. "
            "Beat eggs with salt and pepper, pour over vegetables. "
            "Scatter bacon on top. Fold omelette when edges set. "
            "Serve hot."
        ),
        "diet_label": "Keto",
        "health_label": "High-Protein",
        "cuisine_type": "Western",
    },
]

# Pantry items: (ingredient_name, expiry_date_or_None)
PANTRY_ITEMS = [
    ("Chicken Breast", date(2026, 3, 12)),
    ("Beef", date(2026, 3, 15)),
    ("Milk", date(2026, 3, 16)),
    ("Eggs", date(2026, 3, 17)),
    ("Toast", date(2026, 3, 18)),
    ("Parmesan Cheese", date(2026, 3, 21)),
    ("Wraps", None),
    ("Olive Oil", None),
    ("Onion", None),
    ("Garlic", None),
    ("Carrots", None),
    ("Celery", None),
    ("Lentils", None),
    ("Romaine Lettuce", None),
    ("Avocado", None),
    ("Spinach", None),
    ("Bacon", None),
    ("Butter", None),
]


# ── Helpers ────────────────────────────────────────────────────────────────────

def _ingredient_name(raw: str) -> str:
    """Extract the base ingredient name from a recipe ingredient string."""
    return raw.split(",")[0].strip()


# ── Seed logic ─────────────────────────────────────────────────────────────────

def seed():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # ── Users ──────────────────────────────────────────────────────────────
        users = []
        for data in USERS:
            existing = db.query(User).filter_by(email=data["email"]).first()
            if existing:
                users.append(existing)
            else:
                user = User(**data)
                db.add(user)
                db.flush()
                users.append(user)
                print(f"  Created user: {user.name}")

        alice = users[0]

        # ── Pantry ingredients + items for Alice ───────────────────────────────
        for ing_name, expiry in PANTRY_ITEMS:
            ingredient = db.query(Ingredient).filter_by(name=ing_name).first()
            if not ingredient:
                ingredient = Ingredient(name=ing_name)
                db.add(ingredient)
                db.flush()

            already = (
                db.query(PantryItem)
                .filter_by(user_id=alice.id, ingredient_id=ingredient.id)
                .first()
            )
            if not already:
                db.add(PantryItem(
                    user_id=alice.id,
                    ingredient_id=ingredient.id,
                    expiry_date=expiry,
                ))
                print(f"  Pantry ← {ing_name}")

        # ── Recipes ────────────────────────────────────────────────────────────
        for data in RECIPES:
            existing = db.query(Recipe).filter_by(recipe_name=data["title"]).first()
            if existing:
                continue

            recipe = Recipe(
                user_id=alice.id,
                recipe_name=data["title"],
                content=data["method"],
                diet_label=data.get("diet_label"),
                health_label=data.get("health_label"),
                cuisine_type=data.get("cuisine_type"),
            )
            db.add(recipe)
            db.flush()

            for idx, raw_ing in enumerate(data["ingredients"]):
                ing_name = _ingredient_name(raw_ing)
                ingredient = db.query(Ingredient).filter_by(name=ing_name).first()
                if not ingredient:
                    ingredient = Ingredient(name=ing_name)
                    db.add(ingredient)
                    db.flush()

                db.add(RecipeIngredient(
                    recipe_id=recipe.id,
                    ingredient_id=ingredient.id,
                    order_index=idx,
                ))

            print(f"  Recipe ← {data['title']}")

        # ── Save Alice's first recipe ──────────────────────────────────────────
        first_recipe = db.query(Recipe).first()
        if first_recipe:
            already_saved = (
                db.query(SavedRecipe)
                .filter_by(user_id=alice.id, recipe_id=first_recipe.id)
                .first()
            )
            if not already_saved:
                db.add(SavedRecipe(user_id=alice.id, recipe_id=first_recipe.id))
                print(f"  Saved '{first_recipe.recipe_name}' for {alice.name}")

        db.commit()
        print("\nDone.")

    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    print("Seeding database...")
    seed()
