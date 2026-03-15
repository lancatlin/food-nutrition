export type NutritionPer100g = {
  calories_kcal: number;
  fat_g: number;
  carbs_g: number;
  protein_g: number;
  fiber_g: number;
  sugar_g: number;
};

export type RecipeIngredient = {
  ingredient: string;
  matched_food: string;
  data_type: string;
  per_100g: NutritionPer100g;
  found: boolean;
  error: string | null;
  weight_g: number;
};

export type Recipe = {
  id: number;
  title: string;
  ingredients: string[];
  method: string[];
  validation?: {
    valid: boolean;
    extra_ingredients: string[];
  };
  nutrition?: {
    total_weight_g: number;
    recipe_per_100g: NutritionPer100g;
    ingredients_not_found: string[];
    ingredients: RecipeIngredient[];
    summary: string;
  };
  color?: string; // Tailwind gradient classes for placeholder hero
  emoji?: string;
};
