import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("pantry", "routes/pantry.tsx"),
  route("pantry/add", "routes/addItems.tsx"),
  route("recipes", "routes/recipeList.tsx"),
  route("recipes/add", "routes/generateReceipe.tsx"),
  route("recipes/:id", "routes/recipeDetail.tsx"),
] satisfies RouteConfig;
