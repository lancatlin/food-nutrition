import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("pantry/add", "routes/addItems.tsx"),
  route("recipes/add", "routes/generateReceipe.tsx"),
] satisfies RouteConfig;
