import type { Recipe } from "~/types";
import RecipeHero from "./RecipeHero";
import TagPill from "./TagPill";
import { titleCase } from "~/utils/titleCase";

type Props = {
  recipe: Recipe;
  previewIngredients: string[];
  onClick: () => void;
};

export default function RecipeCard({
  recipe,
  previewIngredients,
  onClick,
}: Props) {
  return (
    <button
      onClick={onClick}
      className="bg-surface rounded-2xl overflow-hidden shadow-md shadow-border-muted text-left transition-transform active:scale-[0.98]"
    >
      <RecipeHero recipe={recipe} className="w-full h-44" />
      <div className="px-4 py-3">
        <p className="text-fg-muted text-xs mb-1">
          {previewIngredients.join(", ")}
        </p>
        <h3 className="text-fg font-bold leading-snug mb-2">{titleCase(recipe.title)}</h3>
        {recipe.nutrition && (
          <div className="flex flex-wrap gap-2">
            <TagPill label={`${Math.round(recipe.nutrition.recipe_per_100g.calories_kcal)} kcal/100g`} filled />
            <TagPill label={`${Math.round(recipe.nutrition.recipe_per_100g.protein_g)}g protein`} filled />
            <TagPill label={`${Math.round(recipe.nutrition.recipe_per_100g.carbs_g)}g carbs/100g`} filled />
            <TagPill label={`${Math.round(recipe.nutrition.recipe_per_100g.fat_g)}g fat/100g`} filled />
            <TagPill label={`${Math.round(recipe.nutrition.recipe_per_100g.fiber_g)}g fiber/100g`} filled />
            <TagPill label={`${Math.round(recipe.nutrition.recipe_per_100g.sugar_g)}g sugar/100g`} filled />
          </div>
        )}
      </div>
    </button>
  );
}
