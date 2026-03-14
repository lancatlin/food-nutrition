import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import Calendar from "~/components/Calendar";
import { getPantryItems } from "~/services/pantry";
import type { PantryItem } from "~/types";
import { getFoodEmoji } from "~/utils/emoji";

// ─── Types ────────────────────────────────────────────────────────────────────

type Toast = {
  item: PantryItem;
  timeoutId: ReturnType<typeof setTimeout>;
};

// ─── Mock Data ────────────────────────────────────────────────────────────────

const today = new Date();
const d = (offsetDays: number) => {
  const date = new Date(today);
  date.setDate(today.getDate() + offsetDays);
  return date;
};

const initialItems: PantryItem[] = [
  { id: 1, name: "Chicken Breast", emoji: "🍗", expiry: d(-2) },
  { id: 2, name: "Beef", emoji: "🥩", expiry: d(1) },
  { id: 3, name: "Milk", emoji: "🥛", expiry: d(2) },
  { id: 4, name: "Eggs", emoji: "🥚", expiry: d(3) },
  { id: 5, name: "Toast", emoji: "🍞", expiry: d(4) },
  { id: 6, name: "Parmesan Cheese", emoji: "🧀", expiry: d(7) },
  { id: 7, name: "Wraps", emoji: "🌯", expiry: null },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function daysUntil(date: Date): number {
  const ms = date.setHours(0, 0, 0, 0) - new Date().setHours(0, 0, 0, 0);
  return Math.ceil(ms / 86_400_000);
}

type ExpiryStatus = "expired" | "soon" | "ok" | "none";

function expiryStatus(expiry: Date | null): ExpiryStatus {
  if (!expiry) return "none";
  const days = daysUntil(expiry);
  if (days < 0) return "expired";
  if (days <= 3) return "soon";
  return "ok";
}

const statusStyles: Record<
  ExpiryStatus,
  { text: string; icon: string; avatar: string }
> = {
  expired: { text: "text-red-500", icon: "text-red-400", avatar: "bg-red-100" },
  soon: {
    text: "text-amber-500",
    icon: "text-amber-400",
    avatar: "bg-amber-100",
  },
  ok: { text: "text-primary", icon: "text-primary", avatar: "bg-primary-tint" },
  none: { text: "text-fg-muted", icon: "text-fg-muted", avatar: "bg-border" },
};

function formatExpiry(expiry: Date): string {
  return expiry.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

function sortItems(items: PantryItem[]): PantryItem[] {
  return [...items].sort((a, b) => {
    if (!a.expiry && !b.expiry) return 0;
    if (!a.expiry) return 1;
    if (!b.expiry) return -1;
    return a.expiry.getTime() - b.expiry.getTime();
  });
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const TOAST_DURATION = 4000;

export default function Pantry() {
  // const [items, setItems] = useState<PantryItem[]>(() =>
  //   sortItems(initialItems),
  // );
  const [toast, setToast] = useState<Toast | null>(null);
  const [calendarFor, setCalendarFor] = useState<number | null>(null);

  const query = useQuery({
    queryKey: ["pantry-items"],
    queryFn: getPantryItems,
  });

  useEffect(
    () => () => {
      if (toast) clearTimeout(toast.timeoutId);
    },
    [],
  );

  const removeItem = (item: PantryItem) => {
    // setItems((prev) => prev.filter((i) => i.id !== item.id));
    if (toast) clearTimeout(toast.timeoutId);
    const timeoutId = setTimeout(() => setToast(null), TOAST_DURATION);
    setToast({ item, timeoutId });
  };

  const undoRemove = () => {
    if (!toast) return;
    clearTimeout(toast.timeoutId);
    // setItems((prev) => sortItems([...prev, toast.item]));
    setToast(null);
  };

  const setExpiry = (id: number, date: Date | null) => console.log(id, date);

  const calendarItem = query.data?.find((i) => i.id === calendarFor) ?? null;

  return (
    <div className="flex-1 flex flex-col pt-14 pb-28">
      <h1 className="text-4xl font-extrabold text-fg px-6 mb-4">My Pantry</h1>

      <div className="flex-1 px-4 overflow-y-auto">
        {query.data?.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 gap-3">
            <span className="text-5xl">🎉</span>
            <p className="text-fg-muted text-sm">Your pantry is empty</p>
          </div>
        ) : (
          <div className="bg-background rounded-3xl overflow-hidden">
            <ul className="divide-y divide-border">
              {query.data?.map((item) => {
                const status = expiryStatus(item.expiry);
                const styles = statusStyles[status];
                return (
                  <li
                    key={item.id}
                    className="flex items-center gap-3 px-4 py-3.5"
                  >
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center text-base shrink-0 transition-colors ${styles.avatar}`}
                    >
                      {getFoodEmoji(item.name)}
                    </div>

                    <span className="flex-1 font-medium text-sm text-fg-secondary">
                      {item.name}
                    </span>

                    {/* Expiry — tap to edit */}
                    <button
                      onClick={() => setCalendarFor(item.id)}
                      className={`flex items-center gap-1.5 shrink-0 transition-colors hover:opacity-70 ${styles.text}`}
                    >
                      {item.expiry && (
                        <span className="text-xs font-semibold">
                          {formatExpiry(item.expiry)}
                        </span>
                      )}
                      <i
                        className={`fa-regular fa-calendar text-sm ${styles.icon}`}
                      />
                    </button>

                    <button
                      onClick={() => removeItem(item)}
                      className="w-7 h-7 flex items-center justify-center rounded-lg text-fg-muted hover:text-red-500 hover:bg-red-50 transition-all shrink-0 ml-1"
                      aria-label={`Remove ${item.name}`}
                    >
                      <i className="fa-solid fa-trash-can text-sm" />
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>

      {/* Toast */}
      <div
        className={`fixed bottom-28 left-4 right-4 z-50 transition-all duration-300 ${
          toast
            ? "opacity-100 translate-y-0"
            : "opacity-0 translate-y-3 pointer-events-none"
        }`}
      >
        <div className="bg-fg text-surface rounded-2xl px-4 py-3 flex items-center justify-between shadow-xl max-w-sm mx-auto">
          <p className="text-sm font-medium truncate">
            Removed <span className="font-bold">{toast?.item.name}</span>
          </p>
          <button
            onClick={undoRemove}
            className="text-primary-light font-bold text-sm ml-4 shrink-0 hover:text-primary-tint transition-colors"
          >
            Undo
          </button>
        </div>
      </div>

      {/* Calendar Modal */}
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
