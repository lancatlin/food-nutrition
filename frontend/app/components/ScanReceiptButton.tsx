import { NavLink } from "react-router";

type Props = {
  className?: string;
  variant?: "ghost" | "solid";
};

export default function ScanReceiptButton({ className = "", variant = "ghost" }: Props) {
  const baseStyles = "transition-all rounded-xl px-3 py-1.5 text-xs font-medium flex items-center gap-1.5";
  const variants = {
    ghost: "bg-white/20 hover:bg-white/30 text-white",
    solid: "bg-primary/10 hover:bg-primary/20 text-primary-dark border border-primary/20",
  };

  return (
    <NavLink
      to="/pantry/add"
      className={`${baseStyles} ${variants[variant]} ${className}`}
    >
      <i className="fa-solid fa-camera text-xs" />
      Scan Receipt
    </NavLink>
  );
}
