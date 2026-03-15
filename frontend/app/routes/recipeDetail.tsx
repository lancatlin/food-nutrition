import { useQuery } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router";
import RecipeDetail from "~/components/RecipeDetail";
import { getRecipe } from "~/services/recipes";
import { sampleRecipe } from "~/types/recipe.data";

export function meta({ params }: { params: { id: string } }) {
  const recipe = sampleRecipe.recipes.find((r) => r.id.toString() === params.id);
  return [{ title: recipe ? recipe.title : "Recipe Not Found" }];
}

export default function RecipeDetailRoute() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: recipe } = useQuery({
    queryKey: ["recipes", id],
    queryFn: () => getRecipe(Number(id || 1)),
  })

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
