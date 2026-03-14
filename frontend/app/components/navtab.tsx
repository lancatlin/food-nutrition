type NavTabProps = {
  icon: string;
  label: string;
  active: boolean;
  onClick: () => void;
};

export default function NavTab({ icon, label, active, onClick }: NavTabProps) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-1 transition-colors ${
        active ? "text-primary" : "text-fg-muted hover:text-fg-secondary"
      }`}
    >
      <div
        className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
          active ? "bg-background-accent" : ""
        }`}
      >
        <i className={`fa-solid fa-${icon} text-xl`} />
      </div>
      <span className="text-[10px] font-semibold">{label}</span>
    </button>
  );
}
