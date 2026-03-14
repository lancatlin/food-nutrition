import { NavLink } from "react-router";

type NavTabProps = {
  to: string;
  icon: string;
  label: string;
  end?: boolean;
};

export default function NavTab({ to, icon, label, end }: NavTabProps) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `flex flex-col items-center gap-1 transition-colors ${
          isActive ? "text-primary" : "text-fg-muted hover:text-fg-secondary"
        }`
      }
    >
      {({ isActive }) => (
        <>
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
              isActive ? "bg-background-accent" : ""
            }`}
          >
            <i className={`fa-solid fa-${icon} text-xl`} />
          </div>
          <span className="text-[10px] font-semibold">{label}</span>
        </>
      )}
    </NavLink>
  );
}
