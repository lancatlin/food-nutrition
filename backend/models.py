from sqlalchemy import (
    Column, Integer, String, Numeric,
    Text, DateTime, Date, ForeignKey, UniqueConstraint
)
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from database import Base


class User(Base):
    __tablename__ = "user"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, nullable=False)
    name = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), onupdate=lambda: datetime.now(timezone.utc))
    saved_recipes = relationship("SavedRecipe", back_populates="user")

    pantry_items = relationship("PantryItem", back_populates="user")



class Ingredient(Base):
    __tablename__ = "ingredient"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)
    nutrition_json = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), onupdate=lambda: datetime.now(timezone.utc))


class PantryItem(Base):
    __tablename__ = "pantry_item"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("user.id"), nullable=False)
    ingredient_id = Column(Integer, ForeignKey("ingredient.id"), nullable=False)
    quantity_unit = Column(String, nullable=True)
    expiry_date = Column(Date, nullable=True)
    added_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), onupdate=lambda: datetime.now(timezone.utc))
    deleted_at = Column(DateTime(timezone=True), nullable=True)

    user = relationship("User", back_populates="pantry_items")
    ingredient = relationship("Ingredient")


class Recipe(Base):
    __tablename__ = "recipe"

    id = Column(Integer, primary_key=True, index=True)
    diet_label = Column(String, nullable=True)
    health_label = Column(String, nullable=True)
    recipe_name = Column(String, nullable=False)
    image_url = Column(String, nullable=True)
    content = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), onupdate=lambda: datetime.now(timezone.utc))
    nutrition_json = Column(Text, nullable=True)
    total_weight_g = Column(Numeric, nullable=True)
    cuisine_type = Column(String, nullable=True)
    saved_by = relationship("SavedRecipe", back_populates="recipe")

    ingredients = relationship("RecipeIngredient", back_populates="recipe")


class RecipeIngredient(Base):
    __tablename__ = "recipe_ingredient"

    id = Column(Integer, primary_key=True, index=True)
    recipe_id = Column(Integer, ForeignKey("recipe.id"), nullable=False)
    ingredient_id = Column(Integer, ForeignKey("ingredient.id"), nullable=False)
    quantity_value = Column(Numeric, nullable=True)
    quantity_unit = Column(String, nullable=True)
    order_index = Column(Integer, nullable=True)

    recipe = relationship("Recipe", back_populates="ingredients")
    ingredient = relationship("Ingredient")

class SavedRecipe(Base):
    __tablename__ = "saved_recipe"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("user.id"), nullable=False)
    recipe_id = Column(Integer, ForeignKey("recipe.id"), nullable=False)
    saved_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    # Relationships
    user = relationship("User", back_populates="saved_recipes")
    recipe = relationship("Recipe", back_populates="saved_by")

    # Prevents the same user saving the same recipe twice
    __table_args__ = (
        UniqueConstraint("user_id", "recipe_id", name="uq_saved_recipe_user_recipe"),
    )