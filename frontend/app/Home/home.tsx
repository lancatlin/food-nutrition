import { useState } from "react";
import { NavLink } from "react-router";
import type { PantryItem } from "~/types";

type FridgeItem = PantryItem & {
  checked: boolean;
};

const initialItems: FridgeItem[] = [
  { id: 1, name: "Chicken Breast", emoji: "🍗", checked: true, expiry: null },
  { id: 2, name: "Lettuce", emoji: "🥬", checked: true, expiry: null },
  { id: 3, name: "Parmesan Cheese", emoji: "🧀", checked: true, expiry: null },
  { id: 4, name: "Milk", emoji: "🥛", checked: false, expiry: null },
  { id: 5, name: "Eggs", emoji: "🥚", checked: true, expiry: null },
  { id: 6, name: "Tomatoes", emoji: "🍅", checked: true, expiry: null },
  { id: 7, name: "Olive Oil", emoji: "🫙", checked: true, expiry: null },
  { id: 8, name: "Garlic", emoji: "🧄", checked: false, expiry: null },
];

export default function Home() {
  const [items, setItems] = useState<FridgeItem[]>(initialItems);

  const toggle = (id: number) =>
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, checked: !item.checked } : item,
      ),
    );

  const checkedCount = items.filter((i) => i.checked).length;

  return (
    <>
      <div className="px-6 pt-14 pb-4">
        <p className="text-primary-dark text-sm font-semibold tracking-widest uppercase mb-1">
          <i className="fa-solid fa-sun mr-2" />
          Good morning
        </p>
        <h1 className="text-4xl font-extrabold text-fg leading-tight">
          What to Cook
          <br />
          <span className="text-primary">Today?</span>
        </h1>
      </div>

      {/* Main Content */}
      <div className="flex-1 px-4 pb-28 overflow-y-auto">
        {/* Fridge Card */}
        <div className="bg-surface rounded-3xl shadow-lg shadow-primary-tint overflow-hidden mt-4">
          {/* Card Header */}
          <div className="bg-gradient-to-r from-primary to-secondary px-5 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 rounded-xl w-10 h-10 flex items-center justify-center">
                <i className="fa-solid fa-snowflake text-white text-lg" />
              </div>
              <div>
                <h2 className="text-white font-bold text-lg leading-tight">
                  My Fridge
                </h2>
                <p className="text-primary-tint text-xs">
                  {checkedCount} of {items.length} items selected
                </p>
              </div>
            </div>
            <NavLink
              to="/pantry/add"
              className="bg-white/20 hover:bg-white/30 transition-colors rounded-xl px-3 py-1.5 text-white text-xs font-medium flex items-center gap-1.5"
            >
              <i className="fa-solid fa-camera text-xs" />
              Scan Receipt
            </NavLink>
          </div>

          {/* Progress Bar */}
          <div className="h-1.5 bg-border">
            <div
              className="h-full bg-gradient-to-r from-primary-light to-secondary transition-all duration-500"
              style={{ width: `${(checkedCount / items.length) * 100}%` }}
            />
          </div>

          {/* Item List */}
          <ul className="divide-y divide-border">
            {items.map((item) => (
              <li
                key={item.id}
                onClick={() => toggle(item.id)}
                className="flex items-center gap-4 px-5 py-3.5 cursor-pointer hover:bg-background transition-colors group"
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-lg shrink-0 transition-all duration-200 ${
                    item.checked
                      ? "bg-primary-tint shadow-sm shadow-primary-tint"
                      : "bg-border"
                  }`}
                >
                  {item.emoji}
                </div>

                <span
                  className={`flex-1 font-medium transition-colors ${
                    item.checked
                      ? "text-fg-secondary"
                      : "text-fg-muted line-through"
                  }`}
                >
                  {item.name}
                </span>

                <div
                  className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center shrink-0 transition-all duration-200 ${
                    item.checked
                      ? "bg-primary border-primary shadow-sm shadow-primary-tint"
                      : "border-border-strong group-hover:border-primary-light"
                  }`}
                >
                  {item.checked && (
                    <i className="fa-solid fa-check text-white text-xs" />
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Inspire Me Button */}
        <NavLink
          to="/recipes/add"
          className="mt-6 w-full bg-gradient-to-r from-primary to-secondary hover:from-primary-dark hover:to-secondary-dark active:scale-[0.98] transition-all text-white font-bold text-lg py-4 rounded-2xl shadow-lg shadow-primary-tint flex items-center justify-center gap-3"
        >
          <i className="fa-solid fa-wand-magic-sparkles text-accent" />
          Inspire Me
          <span className="bg-white/20 text-xs font-semibold px-2 py-0.5 rounded-full">
            AI
          </span>
        </NavLink>

        <p className="text-center text-fg-muted text-xs mt-3">
          <i className="fa-solid fa-circle-info mr-1" />
          Select ingredients to get personalized recipe suggestions
        </p>
      </div>
    </>
  );
}
