import Recipes from "~/Recipes/recipes";

export function meta() {
  return [{ title: "My Recipe Lists" }];
}

export default function RecipeListRoute() {
  return <Recipes />;
}
