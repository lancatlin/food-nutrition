import { useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import type { PantryItem } from "~/types";
import { uploadReceipt } from "~/services/receipt";
import type { ProductSummary } from "~/types";
import { addPantryItems } from "~/services/pantry";
import { toast } from "react-toastify";
import PantryItemList from "~/components/PantryItemList";
import { useNavigate } from "react-router";

// ─── Types ───────────────────────────────────────────────────────────────────

type FoodItem = PantryItem & {
  checked: boolean;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toFoodItems(products: ProductSummary[]): FoodItem[] {
  return products.map((p, i) => ({
    id: i + 1,
    name: p.product_type,
    emoji: p.category === "Food" ? "🛒" : "🧴",
    expiry: null,
    checked: p.category === "Food",
  }));
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AddItems() {
  const navigate = useNavigate();
  const [items, setItems] = useState<FoodItem[]>([]);
  const selectedIdsRef = useRef<Set<number>>(new Set());
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const mutationUpload = useMutation({
    mutationFn: uploadReceipt,
    onError: (err) => toast.error(err.message),
    onSuccess: (data) => setItems(toFoodItems(data.items)),
  });

  const mutationAddPantry = useMutation({
    mutationFn: addPantryItems,
    onError: (err) => toast.error(err.message),
    onSuccess: () => navigate("/"),
  });

  const handleFile = (file: File | undefined) => {
    if (file) mutationUpload.mutate(file);
  };

  const handleAddPantry = () => {
    mutationAddPantry.mutate(items.filter((i) => selectedIdsRef.current.has(i.id)));
  };

  const setExpiry = (id: number, date: Date | null) =>
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, expiry: date } : item)),
    );

  // ── Upload state ────────────────────────────────────────────────────────────
  if (mutationUpload.status === "idle" || mutationUpload.status === "error") {
    return (
      <div className="flex-1 flex flex-col px-6 pt-14 pb-28">
        <h1 className="text-4xl font-extrabold text-fg leading-tight mb-3">
          Upload a<br />
          Receipt
        </h1>
        <p className="text-fg-muted text-sm mb-10 max-w-[240px]">
          Snap a photo of your receipt to automatically add items to your pantry.
        </p>

        <div className="flex flex-col gap-5">
          {/* Camera Card */}
          <button
            onClick={() => cameraInputRef.current?.click()}
            className="group relative bg-gradient-to-br from-primary to-primary-dark rounded-[32px] p-6 text-left shadow-xl shadow-primary-tint transition-all active:scale-[0.98] overflow-hidden"
          >
            <div className="absolute top-0 right-0 -mr-4 -mt-4 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:scale-110 transition-transform" />
            <div className="relative z-10">
              <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center mb-4 backdrop-blur-sm border border-white/30">
                <i className="fa-solid fa-camera text-2xl text-white" />
              </div>
              <h2 className="text-white text-xl font-bold mb-1">Take Photo</h2>
              <p className="text-white/70 text-sm">Directly from your camera</p>
            </div>
          </button>

          {/* Gallery Card */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="group relative bg-surface border border-border rounded-[32px] p-6 text-left transition-all active:scale-[0.98] overflow-hidden"
          >
            <div className="relative z-10 flex items-center justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-primary-tint flex items-center justify-center mb-4 group-hover:bg-primary-light transition-colors">
                  <i className="fa-regular fa-image text-2xl text-primary" />
                </div>
                <h2 className="text-fg text-xl font-bold mb-1">Choose File</h2>
                <p className="text-fg-muted text-sm">Pick from storage or gallery</p>
              </div>
              <i className="fa-solid fa-chevron-right text-border-strong group-hover:translate-x-1 transition-transform" />
            </div>
          </button>
        </div>

        {mutationUpload.status === "error" && (
          <div className="mt-8 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3">
            <i className="fa-solid fa-circle-exclamation text-red-500" />
            <p className="text-red-600 text-sm font-medium">
              Scanning failed. Please try again.
            </p>
          </div>
        )}

        {/* Hidden inputs */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
      </div>
    );
  }

  // ── Processing state ────────────────────────────────────────────────────────
  if (mutationUpload.status === "pending") {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-8 px-6 pb-28">
        <div className="relative">
          <div className="w-24 h-24 rounded-full border-4 border-primary-tint border-t-primary animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <i className="fa-solid fa-wand-magic-sparkles text-2xl text-primary animate-pulse" />
          </div>
        </div>
        <div className="text-center">
          <h1 className="text-2xl font-extrabold text-fg mb-2">Analyzing Receipt</h1>
          <p className="text-fg-muted text-sm max-w-[200px] mx-auto">
            Our AI is identifying ingredients and categories...
          </p>
        </div>
      </div>
    );
  }

  // ── Results state ───────────────────────────────────────────────────────────

  return (
    <div className="flex-1 flex flex-col pt-14 pb-28">
      <h1 className="text-4xl font-extrabold text-fg leading-tight px-6 mb-4">
        Add New
        <br />
        Food Items
      </h1>

      <PantryItemList
        items={items}
        showCheckbox
        modifyExpiry
        defaultChecked={items.map((i) => i.checked)}
        onSetExpiry={setExpiry}
        onSelectionChange={(selected) => {
          selectedIdsRef.current = new Set(selected.map((i) => i.id));
        }}
      />

      <button
        onClick={handleAddPantry}
        className="mt-5 mx-6 bg-background hover:bg-primary-tint transition-colors text-fg font-semibold py-4 rounded-2xl flex items-center justify-center gap-2 border border-border"
      >
        <i className="fa-solid fa-plus text-primary" />
        Add to Inventory
      </button>
    </div>
  );
}
