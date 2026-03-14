import type { PantryItem } from "~/types";
import { api } from "./api";
import { format } from "date-fns";

export async function getPantryItems(): Promise<PantryItem[]> {
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

export async function addPantryItems(
  items: Omit<PantryItem, "id">[],
): Promise<PantryItem[]> {
  const res = await api.post(
    "/pantry/pantry-items",
    items.map(({ name, expiry }) => ({
      ingredient_name: name,
      expiry_date: expiry ? format(expiry, "yyyy-MM-dd") : null,
    })),
  );
  return res.data;
}
