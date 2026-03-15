import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { NavLink } from "react-router";
import PantryItemList from "~/components/PantryItemList";
import { getPantryItems } from "~/services/pantry";
export default function Home() {
  const query = useQuery({
    queryKey: ["pantry-items"],
    queryFn: getPantryItems,
  });

  const [selectedNames, setSelectedNames] = useState<string[]>([]);
  const total = query.data?.length ?? 0;

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
                  {selectedNames.length} of {total} items selected
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
              style={{ width: total > 0 ? `${(selectedNames.length / total) * 100}%` : "0%" }}
            />
          </div>

          <PantryItemList
            items={query.data ?? []}
            showCheckbox
            onSelectionChange={(selected) => setSelectedNames(selected.map(s => s.name))}
          />
        </div>

        {/* Inspire Me Button */}
        <NavLink
          to={`/recipes/add?ingredients=${encodeURIComponent(selectedNames.join(","))}`}
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
