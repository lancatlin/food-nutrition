import { useState } from "react";
import { useNavigate } from "react-router";
import type { Recipe } from "~/types";
import { sampleRecipe } from "~/types/recipe.data";
import RecipeCard from "~/components/RecipeCard";
import RecipeDetail from "~/components/RecipeDetail";

export default function Recipes() {
  const navigate = useNavigate();
  const recipes = sampleRecipe.recipes;

  return (
    <div className="flex-1 flex flex-col pt-14 pb-28 overflow-y-auto">
      <h1 className="text-4xl font-extrabold text-fg px-5 mb-5">
        My Recipe Lists
      </h1>

      <div className="flex flex-col gap-4 px-4">
        {recipes.map((recipe) => (
          <RecipeCard
            key={recipe.id}
            recipe={recipe}
            previewIngredients={recipe.ingredients
              .slice(0, 5)
              .map((i) => i.split(",")[0])}
            onClick={() => navigate(`/recipes/${recipe.id}`)}
          />
        ))}
      </div>
    </div>
  );
}
