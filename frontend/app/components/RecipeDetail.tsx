import type { Recipe } from "./recipe.types";
import RecipeHero from "./RecipeHero";
import TagPill from "./TagPill";

type Props = {
  recipe: Recipe;
  onBack: () => void;
};

export default function RecipeDetail({ recipe, onBack }: Props) {
  return (
    <div className="flex-1 overflow-y-auto pb-28">
      {/* Hero */}
      <div className="relative">
        <RecipeHero recipe={recipe} className="w-full h-56" />
        <button
          onClick={onBack}
          className="absolute top-4 left-4 w-9 h-9 bg-black/30 hover:bg-black/50 rounded-full flex items-center justify-center text-white transition-colors"
        >
          <i className="fa-solid fa-arrow-left text-sm" />
        </button>
      </div>

      <div className="px-5 pt-5 pb-4">
        <h1 className="text-2xl font-extrabold text-fg leading-snug">{recipe.title}</h1>
        <p className="text-fg-muted text-sm mt-1">{recipe.subtitle}</p>
        <div className="flex flex-wrap gap-2 mt-3">
          {recipe.tags.map(tag => <TagPill key={tag} label={tag} />)}
        </div>
      </div>

      <div className="h-px bg-border mx-5" />

      <div className="px-5 py-4">
        <h2 className="text-xl font-extrabold text-fg mb-3">Ingredients</h2>
        <ul className="space-y-1.5">
          {recipe.ingredients.map((ing, i) => (
            <li key={i} className="text-fg-secondary text-sm flex items-start gap-2">
              <span className="text-primary mt-0.5 shrink-0">•</span>
              {ing}
            </li>
          ))}
        </ul>
      </div>

      <div className="h-px bg-border mx-5" />

      <div className="px-5 py-4">
        <h2 className="text-xl font-extrabold text-fg mb-3">Instruction</h2>
        <ol className="space-y-2.5">
          {recipe.instructions.map((step, i) => (
            <li key={i} className="text-fg-secondary text-sm flex items-start gap-3">
              <span className="text-primary font-bold shrink-0">{i + 1}.</span>
              {step}
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
