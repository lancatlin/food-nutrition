import Pantry from "~/Pantry/pantry";

export function meta() {
  return [{ title: "My Pantry" }];
}

export default function PantryRoute() {
  return <Pantry />;
}
