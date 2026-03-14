type Props = { label: string; filled?: boolean };

export default function TagPill({ label, filled = false }: Props) {
  return (
    <span
      className={`px-3 py-1 rounded-full text-xs font-semibold border transition-colors ${
        filled
          ? "bg-primary-tint text-primary border-primary-tint"
          : "border-border-strong text-fg-secondary"
      }`}
    >
      {label}
    </span>
  );
}
