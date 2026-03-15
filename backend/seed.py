"""
Seed the database with sample data for development.
Run from the backend/ directory: ./ .venv/bin/python seed.py
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

# Recipes based on frontend/app/types/recipe.data.ts format
RECIPES = [
    {
        "title": "Steamed Cabbage and Mushrooms",
        "ingredients": [
            "Mushrooms",
            "Cabbage",
            "Salt",
            "Pepper",
            "Garlic",
            "Soy Sauce",
            "Water",
        ],
        "method": [
            "In a medium bowl, combine mushrooms, cabbage, salt, pepper, garlic, and soy sauce. Mix well.",
            "Bring water to a boil in a large pot. Place the bowl with the mushroom mixture in the pot, cover, and let it simmer for 5 minutes.",
            "Stir the mixture once or twice to ensure the mushrooms are cooked evenly.",
            "Serve hot and enjoy!",
        ],
        "diet_label": "Healthy",
        "nutrition": {
            "total_weight_g": 863.75,
            "recipe_per_100g": {
                "calories_kcal": 9.27,
                "fat_g": 0.62,
                "carbs_g": 5.23,
                "protein_g": 2.31,
                "fiber_g": 2.59,
                "sugar_g": 0.18,
            },
            "summary": "What a wonderful healthy choice! This steamed cabbage and mushrooms dish is incredibly low in calories, making it ideal for weight management. Its impressive fiber content helps keep you feeling full and supports healthy digestion.",
            "ingredients_not_found": [],
            "ingredients": [],
        }
    },
    {
        "title": "Lentil Soup with Cumin & Coriander",
        "ingredients": [
            "Garlic",
            "Onion",
            "Carrots",
            "Celery",
            "Olive Oil",
            "Lentils",
            "Cumin",
            "Coriander",
            "Vegetable Broth",
        ],
        "method": [
            "Heat olive oil in a large pot over medium heat. Sauté onion and garlic until softened.",
            "Add carrots, celery, and cumin. Cook for 3 minutes.",
            "Add lentils and vegetable broth. Bring to a boil.",
            "Reduce heat and simmer for 25–30 minutes until lentils are tender.",
            "Season with salt, pepper, and coriander. Serve warm."
        ],
        "diet_label": "Vegan",
        "nutrition": {
            "total_weight_g": 1200,
            "recipe_per_100g": {
                "calories_kcal": 150,
                "fat_g": 4.5,
                "carbs_g": 22,
                "protein_g": 8,
                "fiber_g": 6,
                "sugar_g": 2,
            },
            "summary": "High-fiber vegan lentil soup that is filling and nutritious.",
            "ingredients_not_found": [],
            "ingredients": [],
        }
    },
]

PANTRY_ITEMS = [
    ("Mushrooms", date(2026, 3, 20)),
    ("Cabbage", date(2026, 3, 20)),
    ("Garlic", None),
    ("Onion", None),
    ("Carrots", None),
    ("Celery", None),
    ("Olive Oil", None),
    ("Lentils", None),
    ("Milk", date(2026, 3, 16)),
    ("Eggs", date(2026, 3, 17)),
    ("Beef", date(2026, 3, 15)),
]

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

        # ── Ingredients + Pantry items for Alice ───────────────────────────────
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

            # Handle list-based instructions
            instructions = data["method"]
            if isinstance(instructions, list):
                instructions = "\n".join(instructions)

            recipe = Recipe(
                recipe_name=data["title"],
                recipe_instructions=instructions,
                diet_label=data.get("diet_label"),
                nutrition_json=json.dumps(data.get("nutrition", {})),
                created_at=datetime.now(timezone.utc),
                updated_at=datetime.now(timezone.utc),
            )
            db.add(recipe)
            db.flush()

            for raw_ing in data["ingredients"]:
                # Lookup ingredient
                ingredient = db.query(Ingredient).filter_by(name=raw_ing).first()
                if not ingredient:
                    ingredient = Ingredient(name=raw_ing)
                    db.add(ingredient)
                    db.flush()

                db.add(RecipeIngredient(
                    recipe_id=recipe.id,
                    ingredient_id=ingredient.id,
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
                db.add(SavedRecipe(
                    user_id=alice.id, 
                    recipe_id=first_recipe.id,
                    saved_at=datetime.now(timezone.utc)
                ))
                print(f"  Saved '{first_recipe.recipe_name}' for {alice.name}")

        db.commit()
        print("\nSeeding completed successfully.")

    except Exception as e:
        db.rollback()
        print(f"\nSeeding failed: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    print("Seeding database...")
    seed()
