import type { PantryItem } from "~/types";
import { api } from "./api";
import { format } from "date-fns";

export async function getPantryItems(): Promise<PantryItem[]> {
  const res = await api.get("/pantry/pantry-items");
  return res.data.map(
    ({ id, ingredient_name, quantity_unit, expiry_date, added_at }: any) => ({
      id,
      name: ingredient_name,
      expiry: expiry_date ? new Date(expiry_date) : null,
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

export type PantryItemUpdatePayload = {
  expiry: Date | null;
};

export async function updatePantryItem(
  id: number,
  data: PantryItemUpdatePayload,
): Promise<PantryItem> {
  const res = await api.put(`/pantry/pantry-items/${id}`, data);
  return res.data;
}

export async function removePantryItem(id: number): Promise<string> {
  await api.delete(`/pantry/pantry-items/${id}`);
  return "success";
}
