import GenerateRecipe from "~/GenerateRecipe/generateRecipe";

export function meta() {
  return [{ title: "Finding Recipes" }];
}

export default function GenerateRecipeRoute() {
  return <GenerateRecipe />;
}
