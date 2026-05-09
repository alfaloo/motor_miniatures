"use client";

import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Filter, X } from "lucide-react";

export interface MarketplaceFilterValues {
  brand?: string;
  make?: string;
  scale?: string;
  availability?: string;
  status?: string;
}

interface MarketplaceFilterPanelProps {
  isOpen: boolean;
  activeFilters: MarketplaceFilterValues;
  options: { brands: string[]; makes: string[]; scales: string[]; availabilities: string[]; statuses: string[] };
  onApply: (filters: MarketplaceFilterValues) => void;
  onClear: () => void;
  showStatus?: boolean;
}

const ACTIVE_FILTER_CLASS = "ring-2 ring-amber-400 ring-offset-0";

const AVAILABILITY_LABELS: Record<string, string> = {
  ready_stock: "Ready Stock",
  made_to_order: "Made to Order",
};

const STATUS_LABELS: Record<string, string> = {
  active: "Active",
  sold_out: "Sold Out",
  pre_order: "Pre-Order",
  retired: "Retired",
  unpublished: "Unpublished",
};

function isActive(v: string | undefined): boolean {
  return Boolean(v && v !== "any" && v !== "");
}

export function MarketplaceFilterPanel({
  isOpen,
  activeFilters,
  options,
  onApply,
  onClear,
  showStatus = true,
}: MarketplaceFilterPanelProps) {
  const [values, setValues] = useState<MarketplaceFilterValues>({
    ...activeFilters,
  });

  useEffect(() => {
    if (isOpen) {
      setValues({ ...activeFilters });
    }
  }, [isOpen, activeFilters]);

  function setSelect(field: keyof MarketplaceFilterValues, val: string) {
    setValues((prev) => ({ ...prev, [field]: val }));
  }

  function handleApply() {
    onApply(values);
  }

  function handleClear() {
    setValues({});
    onClear();
  }

  if (!isOpen) return null;

  return (
    <div className="bg-card border border-border rounded-xl p-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Brand */}
        <div className="space-y-1.5">
          <Label className="text-foreground">Brand</Label>
          <Select
            value={values.brand ?? "any"}
            onValueChange={(v) => setSelect("brand", v)}
          >
            <SelectTrigger
              className={`bg-secondary border-border text-foreground ${
                isActive(values.brand) ? ACTIVE_FILTER_CLASS : ""
              }`}
            >
              <SelectValue placeholder="Any brand" />
            </SelectTrigger>
            <SelectContent className="bg-card border-border text-foreground">
              <SelectItem value="any">Any</SelectItem>
              {options.brands.map((b) => (
                <SelectItem key={b} value={b}>
                  {b}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Make */}
        <div className="space-y-1.5">
          <Label className="text-foreground">Make</Label>
          <Select
            value={values.make ?? "any"}
            onValueChange={(v) => setSelect("make", v)}
          >
            <SelectTrigger
              className={`bg-secondary border-border text-foreground ${
                isActive(values.make) ? ACTIVE_FILTER_CLASS : ""
              }`}
            >
              <SelectValue placeholder="Any make" />
            </SelectTrigger>
            <SelectContent className="bg-card border-border text-foreground">
              <SelectItem value="any">Any</SelectItem>
              {options.makes.map((m) => (
                <SelectItem key={m} value={m}>
                  {m}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Scale */}
        <div className="space-y-1.5">
          <Label className="text-foreground">Scale</Label>
          <Select
            value={values.scale ?? "any"}
            onValueChange={(v) => setSelect("scale", v)}
          >
            <SelectTrigger
              className={`bg-secondary border-border text-foreground ${
                isActive(values.scale) ? ACTIVE_FILTER_CLASS : ""
              }`}
            >
              <SelectValue placeholder="Any scale" />
            </SelectTrigger>
            <SelectContent className="bg-card border-border text-foreground">
              <SelectItem value="any">Any</SelectItem>
              {options.scales.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Availability */}
        <div className="space-y-1.5">
          <Label className="text-foreground">Availability</Label>
          <Select
            value={values.availability ?? "any"}
            onValueChange={(v) => setSelect("availability", v)}
          >
            <SelectTrigger
              className={`bg-secondary border-border text-foreground ${
                isActive(values.availability) ? ACTIVE_FILTER_CLASS : ""
              }`}
            >
              <SelectValue placeholder="Any availability" />
            </SelectTrigger>
            <SelectContent className="bg-card border-border text-foreground">
              <SelectItem value="any">Any</SelectItem>
              {options.availabilities.map((a) => (
                <SelectItem key={a} value={a}>
                  {AVAILABILITY_LABELS[a] ?? a}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Status */}
        {showStatus && (
          <div className="space-y-1.5">
            <Label className="text-foreground">Status</Label>
            <Select
              value={values.status ?? "any"}
              onValueChange={(v) => setSelect("status", v)}
            >
              <SelectTrigger
                className={`bg-secondary border-border text-foreground ${
                  isActive(values.status) ? ACTIVE_FILTER_CLASS : ""
                }`}
              >
                <SelectValue placeholder="Any status" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border text-foreground">
                <SelectItem value="any">Any</SelectItem>
                {options.statuses.map((s) => (
                  <SelectItem key={s} value={s}>
                    {STATUS_LABELS[s] ?? s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      <div className="flex gap-3 pt-4">
        <Button
          type="button"
          onClick={handleApply}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Filter className="h-4 w-4 mr-2" />
          Apply
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={handleClear}
          className="border-border bg-secondary hover:bg-accent text-foreground"
        >
          <X className="h-4 w-4 mr-2" />
          Clear
        </Button>
      </div>
    </div>
  );
}
