import { useState, useEffect } from "react";

// ─── Types ───────────────────────────────────────────────────────────────────

type PageState = "upload" | "processing" | "results";
type TabId = "fridge" | "scan" | "recipes";

type FoodItem = {
  id: number;
  name: string;
  emoji: string;
  expiry: Date | null;
  checked: boolean;
};

// ─── Mock Data ────────────────────────────────────────────────────────────────

const mockItems: FoodItem[] = [
  {
    id: 1,
    name: "Chicken Breast",
    emoji: "🍗",
    expiry: new Date(2026, 2, 18),
    checked: true,
  },
  { id: 2, name: "Beef", emoji: "🥩", expiry: null, checked: true },
  {
    id: 3,
    name: "Milk",
    emoji: "🥛",
    expiry: new Date(2026, 2, 21),
    checked: true,
  },
  {
    id: 4,
    name: "Eggs",
    emoji: "🥚",
    expiry: new Date(2026, 2, 31),
    checked: true,
  },
  { id: 5, name: "Pasta", emoji: "🍝", expiry: null, checked: true },
  { id: 6, name: "Parmesan Cheese", emoji: "🧀", expiry: null, checked: true },
  {
    id: 7,
    name: "Toast",
    emoji: "🍞",
    expiry: new Date(2026, 2, 25),
    checked: true,
  },
  { id: 8, name: "Wraps", emoji: "🌯", expiry: null, checked: true },
  { id: 9, name: "Tissue", emoji: "🧻", expiry: null, checked: false },
  { id: 10, name: "Foil", emoji: "✨", expiry: null, checked: false },
  { id: 11, name: "Plastic Bags", emoji: "🛍️", expiry: null, checked: false },
  {
    id: 12,
    name: "Dishwashing Liquid",
    emoji: "🧴",
    expiry: null,
    checked: false,
  },
];

// ─── Calendar ─────────────────────────────────────────────────────────────────

const DAYS = ["S", "M", "T", "W", "T", "F", "S"];
const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
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

type CalendarProps = {
  initial: Date | null;
  onConfirm: (date: Date | null) => void;
  onCancel: () => void;
};

function Calendar({ initial, onConfirm, onCancel }: CalendarProps) {
  const today = new Date();
  const [selected, setSelected] = useState<Date | null>(initial);
  const [viewYear, setViewYear] = useState((initial ?? today).getFullYear());
  const [viewMonth, setViewMonth] = useState((initial ?? today).getMonth());

  const weeks = buildCalendar(viewYear, viewMonth);

  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else setViewMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else setViewMonth((m) => m + 1);
  };

  const isToday = (day: number) =>
    day === today.getDate() &&
    viewMonth === today.getMonth() &&
    viewYear === today.getFullYear();
  const isSelected = (day: number) =>
    selected !== null &&
    day === selected.getDate() &&
    viewMonth === selected.getMonth() &&
    viewYear === selected.getFullYear();

  const dayLabel = selected
    ? selected.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
      })
    : "No date";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      {/* Backdrop */}
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
            <button
              onClick={() => {
                /* month/year picker placeholder */
              }}
              className="flex items-center gap-1 font-semibold text-fg hover:text-primary transition-colors"
            >
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
              <div
                key={i}
                className="text-center text-xs font-semibold text-fg-muted py-1"
              >
                {d}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="space-y-1">
            {weeks.map((week, wi) => (
              <div key={wi} className="grid grid-cols-7">
                {week.map((day, di) => (
                  <div
                    key={di}
                    className="flex items-center justify-center aspect-square"
                  >
                    {day !== null && (
                      <button
                        onClick={() =>
                          setSelected(new Date(viewYear, viewMonth, day))
                        }
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

// ─── Page ─────────────────────────────────────────────────────────────────────

function formatExpiry(date: Date): string {
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

export default function AddItems() {
  const [pageState, setPageState] = useState<PageState>("upload");
  const [activeTab, setActiveTab] = useState<TabId>("scan");
  const [items, setItems] = useState<FoodItem[]>(mockItems);
  const [calendarFor, setCalendarFor] = useState<number | null>(null);

  // Auto-advance from processing → results
  useEffect(() => {
    if (pageState !== "processing") return;
    const t = setTimeout(() => setPageState("results"), 1500);
    return () => clearTimeout(t);
  }, [pageState]);

  const toggleItem = (id: number) =>
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, checked: !item.checked } : item,
      ),
    );

  const setExpiry = (id: number, date: Date | null) =>
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, expiry: date } : item)),
    );

  const calendarItem = items.find((i) => i.id === calendarFor) ?? null;

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      {/* ── Upload ─────────────────────────────────────────────────────── */}
      {pageState === "upload" && (
        <div className="flex-1 flex flex-col px-6 pt-14 pb-28">
          <h1 className="text-4xl font-extrabold text-fg leading-tight mb-8">
            Upload a<br />
            Receipt
          </h1>

          <div className="bg-background rounded-3xl p-8 flex flex-col items-center gap-6">
            <div className="w-16 h-16 rounded-2xl bg-surface flex items-center justify-center shadow-sm">
              <i className="fa-regular fa-file-image text-3xl text-fg-muted" />
            </div>
            <p className="text-fg text-xl font-semibold text-center leading-snug">
              Select a File or
              <br />
              Open Camera
            </p>
            <div className="flex gap-8">
              <button
                onClick={() => setPageState("processing")}
                className="text-primary font-semibold text-sm hover:text-primary-dark transition-colors"
              >
                Select File
              </button>
              <button
                onClick={() => setPageState("processing")}
                className="text-primary font-semibold text-sm hover:text-primary-dark transition-colors"
              >
                Open Camera
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Processing ─────────────────────────────────────────────────── */}
      {pageState === "processing" && (
        <div className="flex-1 flex flex-col items-center justify-center gap-6 pb-28">
          <h1 className="text-4xl font-extrabold text-fg">Processing...</h1>
          <div className="w-14 h-14 rounded-full border-4 border-primary-tint border-t-primary animate-spin" />
          <p className="text-fg-muted text-sm">
            Extracting Food Items from Receipt
          </p>
        </div>
      )}

      {/* ── Results ────────────────────────────────────────────────────── */}
      {pageState === "results" && (
        <div className="flex-1 flex flex-col px-4 pt-14 pb-28">
          <h1 className="text-4xl font-extrabold text-fg leading-tight px-2 mb-4">
            Add New
            <br />
            Food Items
          </h1>

          <div className="bg-background rounded-3xl overflow-hidden">
            <ul className="divide-y divide-border">
              {items.map((item) => (
                <li key={item.id} className="flex items-center gap-3 px-4 py-3">
                  {/* Emoji avatar */}
                  <div className="w-9 h-9 rounded-full bg-primary-tint flex items-center justify-center text-base shrink-0">
                    {item.emoji}
                  </div>

                  {/* Name */}
                  <span
                    className={`flex-1 font-medium text-sm ${item.checked ? "text-fg-secondary" : "text-fg-muted"}`}
                  >
                    {item.name}
                  </span>

                  {/* Expiry date + calendar icon */}
                  <button
                    onClick={() => setCalendarFor(item.id)}
                    className="flex items-center gap-1.5 text-xs font-semibold shrink-0 transition-colors"
                  >
                    {item.expiry ? (
                      <span className="text-primary">
                        {formatExpiry(item.expiry)}
                      </span>
                    ) : null}
                    <i
                      className={`fa-regular fa-calendar text-base ${item.expiry ? "text-primary" : "text-fg-muted"}`}
                    />
                  </button>

                  {/* Checkbox */}
                  <div
                    onClick={() => toggleItem(item.id)}
                    className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 cursor-pointer transition-all ${
                      item.checked
                        ? "bg-primary border-primary"
                        : "border-border-strong hover:border-primary-light"
                    }`}
                  >
                    {item.checked && (
                      <i className="fa-solid fa-check text-white text-[10px]" />
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <button className="mt-5 mx-2 bg-background hover:bg-primary-tint transition-colors text-fg font-semibold py-4 rounded-2xl flex items-center justify-center gap-2 border border-border">
            <i className="fa-solid fa-plus text-primary" />
            Add to Inventory
          </button>
        </div>
      )}

      {/* ── Calendar Modal ─────────────────────────────────────────────── */}
      {calendarFor !== null && calendarItem && (
        <Calendar
          initial={calendarItem.expiry}
          onConfirm={(date) => {
            setExpiry(calendarFor, date);
            setCalendarFor(null);
          }}
          onCancel={() => setCalendarFor(null)}
        />
      )}
    </div>
  );
}
