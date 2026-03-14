import { useState, useEffect } from "react";
import type { Recipe } from "~/components/recipe.types";
import RecipeCard from "~/components/RecipeCard";
import RecipeDetail from "~/components/RecipeDetail";

// ─── Mock Data ────────────────────────────────────────────────────────────────

const usedIngredients = [
  "Chicken Breast",
  "Avocado",
  "Eggs",
  "Tomato",
  "Bacon",
  "Spinach",
  "Onion",
];

const recipes: Recipe[] = [
  {
    id: 1,
    title: "Lentil Soup with Cumin & Coriander",
    subtitle: "A hearty, warming bowl perfect for any season",
    tags: ["Vegan", "Gluten-Free", "High-Fiber"],
    color: "from-amber-400 to-orange-500",
    emoji: "🍲",
    ingredients: [
      "4 cloves garlic, chopped",
      "1 small yellow onion, minced",
      "4 medium carrots, chopped",
      "4 celery stalks, chopped",
      "3 tbsp olive oil",
      "2 cups green or brown lentils, uncooked (I used brown)",
      "1 tsp cumin",
      "½ tsp coriander",
      "8 cups vegetable broth",
    ],
    instructions: [
      "Preheat the oven to 180 degrees celsius.",
      "Rinse the brown rice and cook according to package instructions.",
      "Heat olive oil in a large pot over medium heat. Sauté onion and garlic until softened.",
      "Add carrots, celery, and cumin. Cook for 3 minutes.",
      "Add lentils and vegetable broth. Bring to a boil.",
      "Reduce heat and simmer for 25–30 minutes until lentils are tender.",
      "Season with salt, pepper, and coriander. Serve warm.",
    ],
  },
  {
    id: 2,
    title: "Chicken Caesar Salad",
    subtitle: "Classic and crisp with homemade dressing",
    tags: ["High-Protein", "Low-Carb"],
    color: "from-green-400 to-emerald-600",
    emoji: "🥗",
    ingredients: [
      "2 chicken breasts, grilled and sliced",
      "1 head romaine lettuce, chopped",
      "50g parmesan cheese, shaved",
      "1 avocado, sliced",
      "Caesar dressing to taste",
      "Croutons (optional)",
    ],
    instructions: [
      "Season and grill chicken breasts until cooked through. Rest and slice.",
      "Wash and chop romaine lettuce into bite-sized pieces.",
      "Toss lettuce with Caesar dressing.",
      "Top with chicken, avocado, parmesan, and croutons.",
      "Serve immediately.",
    ],
  },
  {
    id: 3,
    title: "Spinach & Bacon Omelette",
    subtitle: "Quick, filling, and packed with protein",
    tags: ["Keto", "High-Protein", "Quick"],
    color: "from-yellow-300 to-amber-500",
    emoji: "🍳",
    ingredients: [
      "3 large eggs",
      "2 strips bacon, diced",
      "1 cup fresh spinach",
      "¼ onion, diced",
      "Salt and pepper to taste",
      "1 tbsp butter",
    ],
    instructions: [
      "Cook bacon in a non-stick pan until crispy. Set aside.",
      "In the same pan, sauté onion until translucent.",
      "Add spinach and cook until wilted.",
      "Beat eggs with salt and pepper, pour over vegetables.",
      "Scatter bacon on top. Fold omelette when edges set.",
      "Serve hot.",
    ],
  },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

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
    const t = setTimeout(() => setVisibleCount((n) => n + 1), 400);
    return () => clearTimeout(t);
  }, [pageState, visibleCount]);

  if (pageState === "detail" && selected) {
    return (
      <RecipeDetail recipe={selected} onBack={() => setPageState("results")} />
    );
  }

  return (
    <div className="flex-1 flex flex-col pt-14 pb-28 overflow-y-auto">
      <h1 className="text-4xl font-extrabold text-fg px-5 mb-6 leading-tight">
        Finding
        <br />
        Recipes...
      </h1>

      {pageState === "generating" && (
        <div className="flex flex-col items-center gap-5 px-5 mt-4">
          <div className="w-14 h-14 rounded-full border-4 border-primary-tint border-t-primary animate-spin" />
          <p className="text-fg-muted text-sm">
            Extracting Food Items from Receipt
          </p>
          <div className="w-full bg-background rounded-2xl px-5 py-4 mt-2">
            <p className="text-fg font-bold mb-3">Ingredients Included</p>
            <ul className="space-y-2">
              {usedIngredients.map((name) => (
                <li key={name} className="text-fg-secondary text-sm">
                  {name}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {pageState === "results" && (
        <div className="flex flex-col gap-4 px-4">
          {recipes.slice(0, visibleCount).map((recipe) => (
            <RecipeCard
              key={recipe.id}
              recipe={recipe}
              previewIngredients={usedIngredients.slice(0, 5)}
              onClick={() => {
                setSelected(recipe);
                setPageState("detail");
              }}
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
