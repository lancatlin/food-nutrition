export interface ProductSummary {
  product_type: string;
  total_quantity: number;
  unit: string;
  category: "Food" | "Non-Food";
}

export interface AggregatedBill {
  items: ProductSummary[];
}
