import { useState } from "react";

const DAYS = ["S", "M", "T", "W", "T", "F", "S"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function buildCalendar(year: number, month: number): (number | null)[][] {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  const weeks: (number | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}

type Props = {
  initial: Date | null;
  onConfirm: (date: Date | null) => void;
  onCancel: () => void;
};

export default function Calendar({ initial, onConfirm, onCancel }: Props) {
  const today = new Date();
  const [selected, setSelected] = useState<Date | null>(initial);
  const [viewYear, setViewYear] = useState((initial ?? today).getFullYear());
  const [viewMonth, setViewMonth] = useState((initial ?? today).getMonth());

  const weeks = buildCalendar(viewYear, viewMonth);

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };

  const isToday = (day: number) =>
    day === today.getDate() && viewMonth === today.getMonth() && viewYear === today.getFullYear();
  const isSelected = (day: number) =>
    selected !== null &&
    day === selected.getDate() &&
    viewMonth === selected.getMonth() &&
    viewYear === selected.getFullYear();

  const dayLabel = selected
    ? selected.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })
    : "No date";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/30" onClick={onCancel} />

      <div className="relative bg-surface rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden">
        {/* Header */}
        <div className="bg-background px-5 pt-5 pb-3">
          <p className="text-fg-muted text-xs font-semibold uppercase tracking-widest mb-2">
            Select date
          </p>
          <div className="flex items-center justify-between">
            <span className="text-3xl font-bold text-fg">{dayLabel}</span>
            <button className="text-fg-muted hover:text-primary transition-colors">
              <i className="fa-solid fa-pencil text-sm" />
            </button>
          </div>
        </div>

        <div className="h-px bg-border" />

        <div className="px-5 pt-4 pb-2">
          {/* Month / year nav */}
          <div className="flex items-center justify-between mb-4">
            <button className="flex items-center gap-1 font-semibold text-fg hover:text-primary transition-colors">
              {MONTHS[viewMonth]} {viewYear}
              <i className="fa-solid fa-chevron-down text-xs ml-1" />
            </button>
            <div className="flex gap-2">
              <button
                onClick={prevMonth}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-background transition-colors text-fg"
              >
                <i className="fa-solid fa-chevron-left text-sm" />
              </button>
              <button
                onClick={nextMonth}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-background transition-colors text-fg"
              >
                <i className="fa-solid fa-chevron-right text-sm" />
              </button>
            </div>
          </div>

          {/* Day-of-week header */}
          <div className="grid grid-cols-7 mb-1">
            {DAYS.map((d, i) => (
              <div key={i} className="text-center text-xs font-semibold text-fg-muted py-1">{d}</div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="space-y-1">
            {weeks.map((week, wi) => (
              <div key={wi} className="grid grid-cols-7">
                {week.map((day, di) => (
                  <div key={di} className="flex items-center justify-center aspect-square">
                    {day !== null && (
                      <button
                        onClick={() => setSelected(new Date(viewYear, viewMonth, day))}
                        className={`w-9 h-9 rounded-full text-sm font-medium transition-all ${
                          isSelected(day)
                            ? "bg-primary text-white shadow-sm shadow-primary-tint"
                            : isToday(day)
                            ? "border-2 border-primary text-primary"
                            : "text-fg hover:bg-background"
                        }`}
                      >
                        {day}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-4">
          <button
            onClick={() => setSelected(null)}
            className="text-primary font-semibold text-sm hover:text-primary-dark transition-colors"
          >
            Clear
          </button>
          <div className="flex gap-6">
            <button
              onClick={onCancel}
              className="text-fg-muted font-semibold text-sm hover:text-fg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => onConfirm(selected)}
              className="text-primary font-semibold text-sm hover:text-primary-dark transition-colors"
            >
              OK
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
