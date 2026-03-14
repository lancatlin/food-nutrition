import { useState, useEffect } from "react";
import type { Recipe } from "~/components/recipe.types";
import { recipes } from "~/components/recipe.data";
import RecipeCard from "~/components/RecipeCard";
import RecipeDetail from "~/components/RecipeDetail";

const usedIngredients = [
  "Chicken Breast", "Avocado", "Eggs", "Tomato", "Bacon", "Spinach", "Onion",
];

type PageState = "generating" | "results" | "detail";

export default function GenerateRecipe() {
  const [pageState, setPageState] = useState<PageState>("generating");
  const [selected, setSelected] = useState<Recipe | null>(null);
  const [visibleCount, setVisibleCount] = useState(0);

  useEffect(() => {
    if (pageState !== "generating") return;
    const t = setTimeout(() => setPageState("results"), 1800);
    return () => clearTimeout(t);
  }, [pageState]);

  useEffect(() => {
    if (pageState !== "results" || visibleCount >= recipes.length) return;
    const t = setTimeout(() => setVisibleCount(n => n + 1), 400);
    return () => clearTimeout(t);
  }, [pageState, visibleCount]);

  if (pageState === "detail" && selected) {
    return <RecipeDetail recipe={selected} onBack={() => setPageState("results")} />;
  }

  return (
    <div className="flex-1 flex flex-col pt-14 pb-28 overflow-y-auto">
      <h1 className="text-4xl font-extrabold text-fg px-5 mb-6 leading-tight">
        Finding<br />Recipes...
      </h1>

      {pageState === "generating" && (
        <div className="flex flex-col items-center gap-5 px-5 mt-4">
          <div className="w-14 h-14 rounded-full border-4 border-primary-tint border-t-primary animate-spin" />
          <p className="text-fg-muted text-sm">Extracting Food Items from Receipt</p>
          <div className="w-full bg-background rounded-2xl px-5 py-4 mt-2">
            <p className="text-fg font-bold mb-3">Ingredients Included</p>
            <ul className="space-y-2">
              {usedIngredients.map(name => (
                <li key={name} className="text-fg-secondary text-sm">{name}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {pageState === "results" && (
        <div className="flex flex-col gap-4 px-4">
          {recipes.slice(0, visibleCount).map(recipe => (
            <RecipeCard
              key={recipe.id}
              recipe={recipe}
              previewIngredients={usedIngredients.slice(0, 5)}
              onClick={() => { setSelected(recipe); setPageState("detail"); }}
            />
          ))}
          {visibleCount < recipes.length && (
            <div className="flex justify-center py-4">
              <div className="w-10 h-10 rounded-full border-4 border-primary-tint border-t-primary animate-spin" />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
