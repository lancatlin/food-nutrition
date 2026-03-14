import { useState, useEffect } from "react";
import Calendar from "~/components/Calendar";
import type { PantryItem } from "~/types";

// ─── Types ───────────────────────────────────────────────────────────────────

type PageState = "upload" | "processing" | "results";

type FoodItem = PantryItem & {
  checked: boolean;
};

// ─── Mock Data ────────────────────────────────────────────────────────────────

const mockItems: FoodItem[] = [
  {
    id: 1,
    name: "Chicken Breast",
    emoji: "🍗",
    expiry: new Date(2026, 2, 18),
    checked: true,
  },
  { id: 2, name: "Beef", emoji: "🥩", expiry: null, checked: true },
  {
    id: 3,
    name: "Milk",
    emoji: "🥛",
    expiry: new Date(2026, 2, 21),
    checked: true,
  },
  {
    id: 4,
    name: "Eggs",
    emoji: "🥚",
    expiry: new Date(2026, 2, 31),
    checked: true,
  },
  { id: 5, name: "Pasta", emoji: "🍝", expiry: null, checked: true },
  { id: 6, name: "Parmesan Cheese", emoji: "🧀", expiry: null, checked: true },
  {
    id: 7,
    name: "Toast",
    emoji: "🍞",
    expiry: new Date(2026, 2, 25),
    checked: true,
  },
  { id: 8, name: "Wraps", emoji: "🌯", expiry: null, checked: true },
  { id: 9, name: "Tissue", emoji: "🧻", expiry: null, checked: false },
  { id: 10, name: "Foil", emoji: "✨", expiry: null, checked: false },
  { id: 11, name: "Plastic Bags", emoji: "🛍️", expiry: null, checked: false },
  {
    id: 12,
    name: "Dishwashing Liquid",
    emoji: "🧴",
    expiry: null,
    checked: false,
  },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

function formatExpiry(date: Date): string {
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

export default function AddItems() {
  const [pageState, setPageState] = useState<PageState>("upload");
  const [items, setItems] = useState<FoodItem[]>(mockItems);
  const [calendarFor, setCalendarFor] = useState<number | null>(null);

  useEffect(() => {
    if (pageState !== "processing") return;
    const t = setTimeout(() => setPageState("results"), 1500);
    return () => clearTimeout(t);
  }, [pageState]);

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

  const calendarItem = items.find((i) => i.id === calendarFor) ?? null;

  return (
    <div className="flex-1 flex flex-col">
      {/* ── Upload ───────────────────────────────────────────────────────── */}
      {pageState === "upload" && (
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
                onClick={() => setPageState("processing")}
                className="text-primary font-semibold text-sm hover:text-primary-dark transition-colors"
              >
                Select File
              </button>
              <button
                onClick={() => setPageState("processing")}
                className="text-primary font-semibold text-sm hover:text-primary-dark transition-colors"
              >
                Open Camera
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Processing ───────────────────────────────────────────────────── */}
      {pageState === "processing" && (
        <div className="flex-1 flex flex-col items-center justify-center gap-6 pb-28">
          <h1 className="text-4xl font-extrabold text-fg">Processing...</h1>
          <div className="w-14 h-14 rounded-full border-4 border-primary-tint border-t-primary animate-spin" />
          <p className="text-fg-muted text-sm">
            Extracting Food Items from Receipt
          </p>
        </div>
      )}

      {/* ── Results ──────────────────────────────────────────────────────── */}
      {pageState === "results" && (
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
          <button className="mt-5 mx-2 bg-background hover:bg-primary-tint transition-colors text-fg font-semibold py-4 rounded-2xl flex items-center justify-center gap-2 border border-border">
            <i className="fa-solid fa-plus text-primary" />
            Add to Inventory
          </button>
        </div>
      )}

      {/* ── Calendar Modal ───────────────────────────────────────────────── */}
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
