import { NavLink } from "react-router";
import NavTab from "./navtab";

export default function NavBar() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-surface border-t border-border shadow-xl shadow-border-strong/20 px-6 pb-6 pt-3">
      <div className="flex items-center justify-around max-w-sm mx-auto">
        <NavTab to="/pantry" icon="box-archive" label="Pantry" />

        {/* Scan — center FAB */}
        <NavLink to="/" className="flex flex-col items-center gap-1 -mt-6">
          {({ isActive }) => (
            <>
              <div
                className={`w-16 h-16 rounded-2xl shadow-lg flex items-center justify-center transition-all ${
                  isActive
                    ? "bg-gradient-to-br from-primary to-secondary shadow-primary-tint"
                    : "bg-gradient-to-br from-primary-light to-secondary-light shadow-primary-tint"
                }`}
              >
                <i className="fa-solid fa-kitchen-set text-white text-2xl" />
              </div>
              <span
                className={`text-[10px] font-semibold ${
                  isActive ? "text-primary" : "text-fg-muted"
                }`}
              >
                Cook
              </span>
            </>
          )}
        </NavLink>

        <NavTab to="/recipes" icon="book-open" label="Recipes" />
      </div>
    </nav>
  );
}
