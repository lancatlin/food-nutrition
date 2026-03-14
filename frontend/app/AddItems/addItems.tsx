import { useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import Calendar from "~/components/Calendar";
import type { PantryItem } from "~/types";
import { uploadReceipt } from "~/services/receipt";
import type { ProductSummary } from "~/services/receipt";
import { addPantryItems } from "~/services/pantry";

// ─── Types ───────────────────────────────────────────────────────────────────

type FoodItem = PantryItem & {
  checked: boolean;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatExpiry(date: Date): string {
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

function toFoodItems(products: ProductSummary[]): FoodItem[] {
  return products.map((p, i) => ({
    id: i + 1,
    name: p.product_type,
    emoji: p.category === "Food" ? "🛒" : "🧴",
    expiry: null,
    checked: p.category === "Food",
  }));
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AddItems() {
  const [items, setItems] = useState<FoodItem[]>([]);
  const [calendarFor, setCalendarFor] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const mutationUpload = useMutation({
    mutationFn: uploadReceipt,
    onSuccess: (data) => setItems(toFoodItems(data.items)),
  });

  const mutationAddPantry = useMutation({
    mutationFn: addPantryItems,
  });

  const handleFile = (file: File | undefined) => {
    if (file) mutationUpload.mutate(file);
  };

  const handleAddPantry = () => {
    mutationAddPantry.mutate(items.filter((i) => i.checked));
  };

  const calendarItem = items.find((i) => i.id === calendarFor) ?? null;

  const toggleItem = (id: number) =>
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, checked: !item.checked } : item,
      ),
    );

  const setExpiry = (id: number, date: Date | null) =>
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, expiry: date } : item)),
    );

  // ── Upload state ────────────────────────────────────────────────────────────

  if (mutationUpload.status === "idle" || mutationUpload.status === "error") {
    return (
      <div className="flex-1 flex flex-col px-6 pt-14 pb-28">
        <h1 className="text-4xl font-extrabold text-fg leading-tight mb-8">
          Upload a<br />
          Receipt
        </h1>

        <div className="bg-background rounded-3xl p-8 flex flex-col items-center gap-6">
          <div className="w-16 h-16 rounded-2xl bg-surface flex items-center justify-center shadow-sm">
            <i className="fa-regular fa-file-image text-3xl text-fg-muted" />
          </div>
          <p className="text-fg text-xl font-semibold text-center leading-snug">
            Select a File or
            <br />
            Open Camera
          </p>
          <div className="flex gap-8">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="text-primary font-semibold text-sm hover:text-primary-dark transition-colors"
            >
              Select File
            </button>
            <button
              onClick={() => cameraInputRef.current?.click()}
              className="text-primary font-semibold text-sm hover:text-primary-dark transition-colors"
            >
              Open Camera
            </button>
          </div>

          {mutationUpload.status === "error" && (
            <p className="text-red-500 text-sm text-center">
              Upload failed. Please try again.
            </p>
          )}
        </div>

        {/* Hidden file inputs */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
      </div>
    );
  }

  // ── Processing state ────────────────────────────────────────────────────────

  if (mutationUpload.status === "pending") {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-6 pb-28">
        <h1 className="text-4xl font-extrabold text-fg">Processing...</h1>
        <div className="w-14 h-14 rounded-full border-4 border-primary-tint border-t-primary animate-spin" />
        <p className="text-fg-muted text-sm">
          Extracting Food Items from Receipt
        </p>
      </div>
    );
  }

  // ── Results state ───────────────────────────────────────────────────────────

  return (
    <div className="flex-1 flex flex-col">
      <div className="flex-1 flex flex-col px-4 pt-14 pb-28">
        <h1 className="text-4xl font-extrabold text-fg leading-tight px-2 mb-4">
          Add New
          <br />
          Food Items
        </h1>
        <div className="bg-background rounded-3xl overflow-hidden">
          <ul className="divide-y divide-border">
            {items.map((item) => (
              <li key={item.id} className="flex items-center gap-3 px-4 py-3">
                <div className="w-9 h-9 rounded-full bg-primary-tint flex items-center justify-center text-base shrink-0">
                  {item.emoji}
                </div>
                <span
                  className={`flex-1 font-medium text-sm ${item.checked ? "text-fg-secondary" : "text-fg-muted"}`}
                >
                  {item.name}
                </span>
                <button
                  onClick={() => setCalendarFor(item.id)}
                  className="flex items-center gap-1.5 text-xs font-semibold shrink-0 transition-colors"
                >
                  {item.expiry && (
                    <span className="text-primary">
                      {formatExpiry(item.expiry)}
                    </span>
                  )}
                  <i
                    className={`fa-regular fa-calendar text-base ${item.expiry ? "text-primary" : "text-fg-muted"}`}
                  />
                </button>
                <div
                  onClick={() => toggleItem(item.id)}
                  className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 cursor-pointer transition-all ${
                    item.checked
                      ? "bg-primary border-primary"
                      : "border-border-strong hover:border-primary-light"
                  }`}
                >
                  {item.checked && (
                    <i className="fa-solid fa-check text-white text-[10px]" />
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
        <button
          onClick={handleAddPantry}
          className="mt-5 mx-2 bg-background hover:bg-primary-tint transition-colors text-fg font-semibold py-4 rounded-2xl flex items-center justify-center gap-2 border border-border"
        >
          <i className="fa-solid fa-plus text-primary" />
          Add to Inventory
        </button>
      </div>

      {/* ── Calendar Modal ─────────────────────────────────────────────────── */}
      {calendarFor !== null && calendarItem && (
        <Calendar
          initial={calendarItem.expiry}
          onConfirm={(date) => {
            setExpiry(calendarFor, date);
            setCalendarFor(null);
          }}
          onCancel={() => setCalendarFor(null)}
        />
      )}
    </div>
  );
}
