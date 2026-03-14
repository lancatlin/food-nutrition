import { api } from "./api";

export interface ProductSummary {
  product_type: string;
  total_quantity: number;
  unit: string;
  category: "Food" | "Non-Food";
}

export interface AggregatedBill {
  items: ProductSummary[];
}

export async function uploadReceipt(file: File): Promise<AggregatedBill> {
  const form = new FormData();
  form.append("file", file);
  const res = await api.post<AggregatedBill>("/receipts/upload", form);
  return res.data;
}
