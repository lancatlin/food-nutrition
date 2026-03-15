import { api } from "./api";
import type { Recipe } from "~/types";

export type RecipeResponse = {
  ingredients_used: string[];
  recipes: Recipe[];
  nutrition: any[];
};

export async function generateRecipes(
  ingredients: string[],
  numRecipes: number = 1
): Promise<RecipeResponse> {
  const res = await api.post("/recipes", {
    ingredients,
    num_recipes: numRecipes,
  });
  return res.data;
}

export async function getSavedRecipes(): Promise<Recipe[]> {
  const res = await api.get("/recipes");
  return res.data;
}

export async function getRecipe(id: number): Promise<Recipe> {
  const res = await api.get(`/recipes/${id}`);
  return res.data;
}

export async function saveRecipe(id: number): Promise<void> {
  const res = await api.post(`/recipes/${id}/save`);
  return res.data;
}