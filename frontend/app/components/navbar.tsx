import { useState } from "react";
import NavTab from "./navtab";
import { NavLink } from "react-router";

type TabId = "fridge" | "scan" | "recipes";

export default function NavBar() {
  const [activeTab, setActiveTab] = useState<TabId>("fridge");
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-surface border-t border-border shadow-xl shadow-border-strong/20 px-6 pb-6 pt-3">
      <div className="flex items-center justify-around max-w-sm mx-auto">
        <NavTab
          icon="box-archive"
          label="Fridge"
          active={activeTab === "fridge"}
          onClick={() => setActiveTab("fridge")}
        />

        {/* Scan — center FAB */}
        <NavLink
          to="/add-items"
          onClick={() => setActiveTab("scan")}
          className="flex flex-col items-center gap-1 -mt-6"
        >
          <div
            className={`w-16 h-16 rounded-2xl shadow-lg flex items-center justify-center transition-all ${
              activeTab === "scan"
                ? "bg-gradient-to-br from-primary to-secondary shadow-primary-tint"
                : "bg-gradient-to-br from-primary-light to-secondary-light shadow-primary-tint"
            }`}
          >
            <i className="fa-solid fa-camera text-white text-2xl" />
          </div>
          <span
            className={`text-[10px] font-semibold ${
              activeTab === "scan" ? "text-primary" : "text-fg-muted"
            }`}
          >
            Scan
          </span>
        </NavLink>

        <NavTab
          icon="book-open"
          label="Recipes"
          active={activeTab === "recipes"}
          onClick={() => setActiveTab("recipes")}
        />
      </div>
    </nav>
  );
}
