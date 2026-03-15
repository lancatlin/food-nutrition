import { api } from "./api";
import type { Recipe } from "~/types";

export type RecipeResponse = {
  ingredients_used: string[];
  recipes: Recipe[];
  nutrition: any[];
};

export async function generateRecipes(
  ingredients: string[],
  numRecipes: number = 3
): Promise<RecipeResponse> {
  const res = await api.post("/recipes", {
    ingredients,
    num_recipes: numRecipes,
  });
  return res.data;
}
