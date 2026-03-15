import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { useQuery } from "@tanstack/react-query";
import RecipeCard from "~/components/RecipeCard";
import { generateRecipes } from "~/services/recipes";

type PageState = "generating" | "ready";

export default function GenerateRecipe() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const ingredientsStr = searchParams.get("ingredients") || "";
  const usedIngredients = ingredientsStr ? ingredientsStr.split(",") : [];

  const { data, isLoading } = useQuery({
    queryKey: ["generated-recipes", ingredientsStr],
    queryFn: () => generateRecipes(usedIngredients),
    staleTime: 1000 * 60 * 5, // 5 minutes
    enabled: usedIngredients.length > 0,
  });

  const recipes = data?.recipes || [];
  const [pageState, setPageState] = useState<PageState>("generating");
  const [visibleCount, setVisibleCount] = useState(0);

  // Skip animation if we already have recipes (e.g. back navigation)
  useEffect(() => {
    if (recipes.length > 0 && pageState === "generating") {
      setPageState("ready");
      setVisibleCount(recipes.length);
    }
  }, [recipes, pageState]);

  // Initial generation delay (only if not already ready)
  useEffect(() => {
    if (pageState !== "generating" || isLoading) return;
    const t = setTimeout(() => setPageState("ready"), 1500);
    return () => clearTimeout(t);
  }, [pageState, isLoading]);

  // Sequential reveal animation
  useEffect(() => {
    if (pageState !== "ready" || visibleCount >= recipes.length) return;
    const t = setTimeout(() => setVisibleCount((n) => n + 1), 300);
    return () => clearTimeout(t);
  }, [pageState, visibleCount, recipes.length]);

  return (
    <div className="flex-1 flex flex-col pt-14 pb-28 overflow-y-auto">
      <h1 className="text-4xl font-extrabold text-fg px-5 mb-6 leading-tight">
        {pageState === "generating" ? (
          <>Finding<br />Recipes...</>
        ) : (
          <>Recipe<br />Suggestions</>
        )}
      </h1>

      {pageState === "generating" && (
        <div className="flex flex-col items-center gap-5 px-5 mt-4">
          <div className="w-14 h-14 rounded-full border-4 border-primary-tint border-t-primary animate-spin" />
          <p className="text-fg-muted text-sm">AI is cooking up something special...</p>
          <div className="w-full bg-surface rounded-2xl px-5 py-4 mt-2 border border-border">
            <p className="text-fg font-bold mb-3">Ingredients Included</p>
            <ul className="flex flex-wrap gap-2">
              {usedIngredients.map(name => (
                <li key={name} className="bg-primary-tint text-primary-dark text-xs font-semibold px-3 py-1 rounded-full border border-primary/10">
                  {name}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {pageState === "ready" && (
        <div className="flex flex-col gap-4 px-4">
          {recipes.slice(0, visibleCount).map(recipe => (
            <RecipeCard
              key={recipe.id}
              recipe={recipe}
              previewIngredients={usedIngredients.slice(0, 5)}
              onClick={() => navigate(`/recipes/${recipe.id}`)}
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

