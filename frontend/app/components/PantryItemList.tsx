import { useEffect, useRef, useState } from "react";
import type { PantryItem } from "~/types";
import { getFoodEmoji } from "~/utils/emoji";
import Calendar from "./Calendar";
import { titleCase } from "~/utils/titleCase";

export type PantryItemListProp = {
  items: PantryItem[];
  showRemove?: boolean;
  modifyExpiry?: boolean;
  showCheckbox?: boolean;
  defaultChecked?: boolean[];
  onRemove?: (item: PantryItem) => void;
  onSetExpiry?: (id: number, date: Date | null) => void;
  onSelectionChange?: (selected: PantryItem[]) => void;
};

type Toast = {
  item: PantryItem;
  timeoutId: ReturnType<typeof setTimeout>;
};

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

const TOAST_DURATION = 4000;

export default function PantryItemList({
  items,
  showRemove,
  modifyExpiry,
  showCheckbox,
  defaultChecked,
  onRemove,
  onSetExpiry,
  onSelectionChange,
}: PantryItemListProp) {
  const [toast, setToast] = useState<Toast | null>(null);
  const [calendarFor, setCalendarFor] = useState<number | null>(null);
  const [selection, setSelection] = useState<boolean[]>(() =>
    defaultChecked ?? Array(items.length).fill(true),
  );

  // Track item IDs to detect when a completely new set of items is loaded
  const itemIds = items.map((i) => i.id).join(",");
  const prevItemIds = useRef("");

  useEffect(
    () => () => {
      if (toast) clearTimeout(toast.timeoutId);
    },
    [],
  );

  useEffect(() => {
    if (itemIds === prevItemIds.current) return;
    prevItemIds.current = itemIds;
    const next = defaultChecked ?? Array(items.length).fill(true);
    setSelection(next);
    onSelectionChange?.(items.filter((_, i) => next[i]));
  }, [itemIds]);

  const toggle = (i: number) => {
    const next = selection.map((x, j) => (i === j ? !x : x));
    setSelection(next);
    onSelectionChange?.(items.filter((_, j) => next[j]));
  };

  const removeItem = (item: PantryItem) => {
    onRemove?.(item);
    if (toast) clearTimeout(toast.timeoutId);
    const timeoutId = setTimeout(() => setToast(null), TOAST_DURATION);
    setToast({ item, timeoutId });
  };

  const undoRemove = () => {
    if (!toast) return;
    clearTimeout(toast.timeoutId);
    setToast(null);
  };

  const calendarItem = items.find((i) => i.id === calendarFor) ?? null;

  return (
    <>
      <div className="flex-1 px-4 overflow-y-auto">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 gap-3">
            <span className="text-5xl">🎉</span>
            <p className="text-fg-muted text-sm">Your pantry is empty</p>
          </div>
        ) : (
          <div className="bg-background rounded-3xl overflow-hidden">
            <ul className="divide-y divide-border">
              {items.map((item, i) => {
                const status = expiryStatus(item.expiry);
                const styles = statusStyles[status];
                return (
                  <li
                    key={item.id}
                    className="flex items-center gap-3 px-4 py-3.5 transition-discrete"
                  >
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center text-base shrink-0 transition-colors ${styles.avatar}`}
                    >
                      {getFoodEmoji(item.name)}
                    </div>

                    <span className="flex-1 font-medium text-sm text-fg-secondary">
                      {titleCase(item.name)}
                    </span>

                    {/* Expiry — tap to edit */}
                    <button
                      onClick={() => modifyExpiry && setCalendarFor(item.id)}
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

                    {showRemove && (
                      <button
                        onClick={() => removeItem(item)}
                        className="w-7 h-7 flex items-center justify-center rounded-lg text-fg-muted hover:text-red-500 hover:bg-red-50 transition-all shrink-0 ml-1"
                        aria-label={`Remove ${item.name}`}
                      >
                        <i className="fa-solid fa-trash-can text-sm" />
                      </button>
                    )}
                    {showCheckbox && (
                      <div
                        onClick={() => toggle(i)}
                        className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center shrink-0 transition-all duration-200 ${selection[i]
                          ? "bg-primary border-primary shadow-sm shadow-primary-tint"
                          : "border-border-strong group-hover:border-primary-light"
                          }`}
                      >
                        {selection[i] && (
                          <i className="fa-solid fa-check text-white text-xs" />
                        )}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>

      {/* Toast */}
      <div
        className={`fixed bottom-28 left-4 right-4 z-50 transition-all duration-300 ${toast
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
            onSetExpiry?.(calendarFor, date);
            setCalendarFor(null);
          }}
          onCancel={() => setCalendarFor(null)}
        />
      )}
    </>
  );
}
