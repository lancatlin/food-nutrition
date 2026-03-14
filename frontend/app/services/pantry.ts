import type { PantryItem } from "~/types";
import { api } from "./api";

export async function getPantryList(): Promise<PantryItem[]> {
  const res = await api.get("/pantry/pantry-items");
  return res.data.map(
    ({ id, ingredient_name, quantity_unit, expiry_date, added_at }: any) => ({
      id,
      name: ingredient_name,
      expiry: new Date(expiry_date),
      added_at,
    }),
  );
}
