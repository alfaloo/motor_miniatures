"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { updateStorefrontVisibility, type StorefrontVisibilitySettings } from "@/lib/actions/storefront";

const STATUS_CONFIG: { key: keyof StorefrontVisibilitySettings; label: string }[] = [
  { key: "storefront_show_active", label: "Active" },
  { key: "storefront_show_pre_order", label: "Pre-order" },
  { key: "storefront_show_sold_out", label: "Sold Out" },
  { key: "storefront_show_retired", label: "Retired" },
  { key: "storefront_show_unpublished", label: "Unpublished" },
];

export function StorefrontVisibilityPanel({ settings }: { settings: StorefrontVisibilitySettings }) {
  const [local, setLocal] = useState(settings);
  const [isPending, startTransition] = useTransition();

  function handleToggle(key: keyof StorefrontVisibilitySettings) {
    const prev = local;
    const next = { ...local, [key]: !local[key] };
    setLocal(next);
    startTransition(async () => {
      try {
        await updateStorefrontVisibility(next);
      } catch {
        setLocal(prev);
        toast.error("Failed to update visibility settings");
      }
    });
  }

  return (
    <div className="space-y-3">
      <div>
        <p className="text-sm font-medium text-foreground">Storefront visibility</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          Choose which listing statuses appear on your public store
        </p>
      </div>
      <div className="flex flex-wrap gap-x-6 gap-y-2.5">
        {STATUS_CONFIG.map(({ key, label }) => (
          <label key={key} className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={local[key]}
              onChange={() => handleToggle(key)}
              disabled={isPending}
              className="h-4 w-4 rounded border-border accent-primary"
            />
            <span className="text-sm text-foreground">{label}</span>
          </label>
        ))}
      </div>
    </div>
  );
}
