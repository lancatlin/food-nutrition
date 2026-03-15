import { useQuery } from "@tanstack/react-query";
import { useNavigate, useParams, useLoaderData } from "react-router";
import type { ClientLoaderFunctionArgs } from "react-router";
import RecipeDetail from "~/components/RecipeDetail";
import { getRecipe } from "~/services/recipes";
import { titleCase } from "~/utils/titleCase";
import type { Recipe } from "~/types";

export async function clientLoader({ params }: ClientLoaderFunctionArgs) {
  const recipe = await getRecipe(Number(params.id));
  return { recipe };
}

export function meta({ data }: { data: { recipe: Recipe } | undefined }) {
  const title = data?.recipe ? titleCase(data.recipe.title) : "Recipe Details";
  return [{ title: `${title} | Food Nutrition` }];
}

export default function RecipeDetailRoute() {
  const { id } = useParams();
  const navigate = useNavigate();
  const initialData = useLoaderData() as { recipe: Recipe };

  const { data: recipe } = useQuery({
    queryKey: ["recipes", id],
    queryFn: () => getRecipe(Number(id)),
    initialData: initialData.recipe,
  });

  if (!recipe) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <h1 className="text-2xl font-bold text-fg mb-2">Recipe Not Found</h1>
        <p className="text-fg-muted mb-6">The recipe you're looking for doesn't exist.</p>
        <button
          onClick={() => navigate("/recipes")}
          className="bg-primary text-white font-bold px-6 py-2 rounded-xl"
        >
          Go Back
        </button>
      </div>
    );
  }

  return <RecipeDetail recipe={recipe} onBack={() => navigate(-1)} />;
}
