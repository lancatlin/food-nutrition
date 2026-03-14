import AddItems from "~/AddItems/addItems";
import type { Route } from "../+types/root";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Add Items" },
    { name: "description", content: "Welcome to React Router!" },
  ];
}

export default function AddItemsRoute() {
  return <AddItems />;
}
