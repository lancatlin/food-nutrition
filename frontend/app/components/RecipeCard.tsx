import type { Recipe } from "~/types";
import RecipeHero from "./RecipeHero";
import TagPill from "./TagPill";

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
        <h3 className="text-fg font-bold leading-snug mb-2">{recipe.title}</h3>
        <div className="flex flex-wrap gap-2">
          {recipe.tags.map((tag) => (
            <TagPill key={tag} label={tag} filled />
          ))}
        </div>
      </div>
    </button>
  );
}
