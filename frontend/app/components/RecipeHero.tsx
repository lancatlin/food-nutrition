import type { Recipe } from "~/types";

type Props = { recipe: Recipe; className?: string };

export default function RecipeHero({ recipe, className = "" }: Props) {
  return (
    <div
      className={`bg-gradient-to-br ${recipe.color || 'from-green-400 to-emerald-600'} flex items-center justify-center ${className}`}
    >
      <span className="text-7xl drop-shadow-lg">{recipe.emoji || '🍲'}</span>
    </div>
  );
}
