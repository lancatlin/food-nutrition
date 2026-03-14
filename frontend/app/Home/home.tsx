import { useState } from "react";
import type { Route } from "../routes/+types/home";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "What to Cook Today?" },
    { name: "description", content: "Food Nutrition App" },
  ];
}

type FridgeItem = {
  id: number;
  name: string;
  emoji: string;
  checked: boolean;
};

const initialItems: FridgeItem[] = [
  { id: 1, name: "Chicken Breast", emoji: "🍗", checked: true },
  { id: 2, name: "Lettuce", emoji: "🥬", checked: true },
  { id: 3, name: "Parmesan Cheese", emoji: "🧀", checked: true },
  { id: 4, name: "Milk", emoji: "🥛", checked: false },
  { id: 5, name: "Eggs", emoji: "🥚", checked: true },
  { id: 6, name: "Tomatoes", emoji: "🍅", checked: true },
  { id: 7, name: "Olive Oil", emoji: "🫙", checked: true },
  { id: 8, name: "Garlic", emoji: "🧄", checked: false },
];

export default function Home() {
  const [items, setItems] = useState<FridgeItem[]>(initialItems);
  const [activeTab, setActiveTab] = useState<"fridge" | "scan" | "recipes">("fridge");

  const toggle = (id: number) =>
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, checked: !item.checked } : item))
    );

  const checkedCount = items.filter((i) => i.checked).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-emerald-50 flex flex-col">
      {/* Header */}
      <div className="px-6 pt-14 pb-4">
        <p className="text-emerald-600 text-sm font-semibold tracking-widest uppercase mb-1">
          <i className="fa-solid fa-sun mr-2" />
          Good morning
        </p>
        <h1 className="text-4xl font-extrabold text-slate-800 leading-tight">
          What to Cook<br />
          <span className="text-emerald-500">Today?</span>
        </h1>
      </div>

      {/* Main Content */}
      <div className="flex-1 px-4 pb-28 overflow-y-auto">
        {/* Fridge Card */}
        <div className="bg-white rounded-3xl shadow-lg shadow-emerald-100 overflow-hidden mt-4">
          {/* Card Header */}
          <div className="bg-gradient-to-r from-emerald-500 to-teal-400 px-5 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 rounded-xl w-10 h-10 flex items-center justify-center">
                <i className="fa-solid fa-snowflake text-white text-lg" />
              </div>
              <div>
                <h2 className="text-white font-bold text-lg leading-tight">My Fridge</h2>
                <p className="text-emerald-100 text-xs">
                  {checkedCount} of {items.length} items selected
                </p>
              </div>
            </div>
            <button className="bg-white/20 hover:bg-white/30 transition-colors rounded-xl px-3 py-1.5 text-white text-xs font-medium flex items-center gap-1.5">
              <i className="fa-solid fa-plus text-xs" />
              Add
            </button>
          </div>

          {/* Progress Bar */}
          <div className="h-1.5 bg-slate-100">
            <div
              className="h-full bg-gradient-to-r from-emerald-400 to-teal-400 transition-all duration-500"
              style={{ width: `${(checkedCount / items.length) * 100}%` }}
            />
          </div>

          {/* Item List */}
          <ul className="divide-y divide-slate-50">
            {items.map((item) => (
              <li
                key={item.id}
                onClick={() => toggle(item.id)}
                className="flex items-center gap-4 px-5 py-3.5 cursor-pointer hover:bg-slate-50 transition-colors group"
              >
                {/* Emoji Avatar */}
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-lg shrink-0 transition-all duration-200 ${
                    item.checked
                      ? "bg-emerald-100 shadow-sm shadow-emerald-200"
                      : "bg-slate-100"
                  }`}
                >
                  {item.emoji}
                </div>

                {/* Name */}
                <span
                  className={`flex-1 font-medium transition-colors ${
                    item.checked ? "text-slate-700" : "text-slate-400 line-through"
                  }`}
                >
                  {item.name}
                </span>

                {/* Checkbox */}
                <div
                  className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center shrink-0 transition-all duration-200 ${
                    item.checked
                      ? "bg-emerald-500 border-emerald-500 shadow-sm shadow-emerald-300"
                      : "border-slate-300 group-hover:border-emerald-300"
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
        <button className="mt-6 w-full bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-600 hover:to-teal-500 active:scale-[0.98] transition-all text-white font-bold text-lg py-4 rounded-2xl shadow-lg shadow-emerald-200 flex items-center justify-center gap-3">
          <i className="fa-solid fa-wand-magic-sparkles text-yellow-300" />
          Inspire Me
          <span className="bg-white/20 text-xs font-semibold px-2 py-0.5 rounded-full">
            AI
          </span>
        </button>

        {/* Tip */}
        <p className="text-center text-slate-400 text-xs mt-3">
          <i className="fa-solid fa-circle-info mr-1" />
          Select ingredients to get personalized recipe suggestions
        </p>
      </div>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 shadow-xl shadow-slate-200/50 px-6 pb-6 pt-3">
        <div className="flex items-center justify-around max-w-sm mx-auto">
          {/* Fridge Tab */}
          <button
            onClick={() => setActiveTab("fridge")}
            className={`flex flex-col items-center gap-1 transition-colors ${
              activeTab === "fridge" ? "text-emerald-500" : "text-slate-400 hover:text-slate-600"
            }`}
          >
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
                activeTab === "fridge" ? "bg-emerald-50" : ""
              }`}
            >
              <i className="fa-solid fa-box-archive text-xl" />
            </div>
            <span className="text-[10px] font-semibold">Fridge</span>
          </button>

          {/* Scan Tab (Center FAB) */}
          <button
            onClick={() => setActiveTab("scan")}
            className="flex flex-col items-center gap-1 -mt-6"
          >
            <div
              className={`w-16 h-16 rounded-2xl shadow-lg flex items-center justify-center transition-all ${
                activeTab === "scan"
                  ? "bg-gradient-to-br from-emerald-500 to-teal-400 shadow-emerald-300"
                  : "bg-gradient-to-br from-emerald-400 to-teal-300 shadow-emerald-200"
              }`}
            >
              <i className="fa-solid fa-camera text-white text-2xl" />
            </div>
            <span
              className={`text-[10px] font-semibold ${
                activeTab === "scan" ? "text-emerald-500" : "text-slate-400"
              }`}
            >
              Scan
            </span>
          </button>

          {/* Recipes Tab */}
          <button
            onClick={() => setActiveTab("recipes")}
            className={`flex flex-col items-center gap-1 transition-colors ${
              activeTab === "recipes" ? "text-emerald-500" : "text-slate-400 hover:text-slate-600"
            }`}
          >
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
                activeTab === "recipes" ? "bg-emerald-50" : ""
              }`}
            >
              <i className="fa-solid fa-book-open text-xl" />
            </div>
            <span className="text-[10px] font-semibold">Recipes</span>
          </button>
        </div>
      </nav>
    </div>
  );
}
