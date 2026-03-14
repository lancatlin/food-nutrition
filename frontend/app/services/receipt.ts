import type { AggregatedBill } from "~/types";
import { api } from "./api";

export async function uploadReceipt(file: File): Promise<AggregatedBill> {
  // const form = new FormData();
  // form.append("file", file);
  // const res = await api.post<AggregatedBill>("/receipts/upload", form);
  // return res.data;
  return mockUploadReceipt();
}

const mockData: AggregatedBill = {
  items: [
    {
      product_type: "Banana Cavendish",
      total_quantity: 0.852,
      unit: "kilograms",
      category: "Food",
    },
    {
      product_type: "Whole Milk",
      total_quantity: 3.0,
      unit: "litres",
      category: "Food",
    },
    {
      product_type: "Beef Lasagne",
      total_quantity: 2.0,
      unit: "kilograms",
      category: "Food",
    },
    {
      product_type: "Chicken Breast Fillets",
      total_quantity: 1.0,
      unit: "kilograms",
      category: "Food",
    },
    {
      product_type: "Hot Roast Chicken",
      total_quantity: 1.0,
      unit: "kilograms",
      category: "Food",
    },
    {
      product_type: "Salad Baby Spinach",
      total_quantity: 280.0,
      unit: "grams",
      category: "Food",
    },
    {
      product_type: "Crusty Long Rolls",
      total_quantity: 6.0,
      unit: "pieces",
      category: "Food",
    },
  ],
};

export async function mockUploadReceipt(): Promise<AggregatedBill> {
  return new Promise((res) => {
    setTimeout(() => res(mockData), 1000);
  });
}
