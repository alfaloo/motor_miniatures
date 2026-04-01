"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
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

export interface FilterValues {
  brand?: string;
  make?: string;
  model?: string;
  variant?: string;
  scale?: string;
  grade?: string;
  serial_number?: string;
  production_count?: string;
  purchase_platform?: string;
  purchase_price?: string;
  purchase_year?: string;
  purchase_month?: string;
  is_preorder?: string;
  received_year?: string;
  received_month?: string;
  is_sold?: string;
  sold_price?: string;
  sold_platform?: string;
  sold_year?: string;
  sold_month?: string;
}

interface FilterPanelProps {
  isOpen: boolean;
  collectingSinceYear: number;
  activeFilters: FilterValues;
  onApply: (filters: FilterValues) => void;
  onClear: () => void;
}

const MONTHS = [
  { value: "1", label: "January" },
  { value: "2", label: "February" },
  { value: "3", label: "March" },
  { value: "4", label: "April" },
  { value: "5", label: "May" },
  { value: "6", label: "June" },
  { value: "7", label: "July" },
  { value: "8", label: "August" },
  { value: "9", label: "September" },
  { value: "10", label: "October" },
  { value: "11", label: "November" },
  { value: "12", label: "December" },
];

// Highlight class for fields with active filter values (amber, distinct from green-glow for saved settings)
const ACTIVE_FILTER_CLASS = "ring-2 ring-amber-400 ring-offset-0";

function isActive(value: string | undefined): boolean {
  return Boolean(value && value !== "any" && value !== "");
}

export function FilterPanel({
  isOpen,
  collectingSinceYear,
  activeFilters,
  onApply,
  onClear,
}: FilterPanelProps) {
  const [values, setValues] = useState<FilterValues>({ ...activeFilters });

  // Re-sync form values from activeFilters each time the panel is opened
  useEffect(() => {
    if (isOpen) {
      setValues({ ...activeFilters });
    }
  }, [isOpen, activeFilters]);

  const currentYear = new Date().getFullYear();
  const years: number[] = [];
  for (let y = currentYear; y >= collectingSinceYear; y--) {
    years.push(y);
  }

  function setText(field: keyof FilterValues, val: string) {
    setValues((prev) => ({ ...prev, [field]: val }));
  }

  function setSelect(field: keyof FilterValues, val: string) {
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
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 space-y-6">
      {/* Identity */}
      <div>
        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-4">
          Identity
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="fp-brand" className="text-slate-300">Brand</Label>
            <Input
              id="fp-brand"
              placeholder="e.g. Autoart"
              value={values.brand ?? ""}
              onChange={(e) => setText("brand", e.target.value)}
              className={`bg-slate-700 border-slate-600 text-white placeholder:text-slate-500 ${
                isActive(values.brand) ? ACTIVE_FILTER_CLASS : ""
              }`}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="fp-make" className="text-slate-300">Make</Label>
            <Input
              id="fp-make"
              placeholder="e.g. Porsche"
              value={values.make ?? ""}
              onChange={(e) => setText("make", e.target.value)}
              className={`bg-slate-700 border-slate-600 text-white placeholder:text-slate-500 ${
                isActive(values.make) ? ACTIVE_FILTER_CLASS : ""
              }`}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="fp-model" className="text-slate-300">Model</Label>
            <Input
              id="fp-model"
              placeholder="e.g. 911 GT3"
              value={values.model ?? ""}
              onChange={(e) => setText("model", e.target.value)}
              className={`bg-slate-700 border-slate-600 text-white placeholder:text-slate-500 ${
                isActive(values.model) ? ACTIVE_FILTER_CLASS : ""
              }`}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="fp-variant" className="text-slate-300">Variant</Label>
            <Input
              id="fp-variant"
              placeholder="e.g. Racing Edition"
              value={values.variant ?? ""}
              onChange={(e) => setText("variant", e.target.value)}
              className={`bg-slate-700 border-slate-600 text-white placeholder:text-slate-500 ${
                isActive(values.variant) ? ACTIVE_FILTER_CLASS : ""
              }`}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-slate-300">Scale</Label>
            <Select
              value={values.scale ?? "any"}
              onValueChange={(v) => setSelect("scale", v)}
            >
              <SelectTrigger
                className={`bg-slate-700 border-slate-600 text-white ${
                  isActive(values.scale) ? ACTIVE_FILTER_CLASS : ""
                }`}
              >
                <SelectValue placeholder="Any scale" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700 text-white">
                <SelectItem value="any">Any</SelectItem>
                <SelectItem value="1/18">1/18</SelectItem>
                <SelectItem value="1/24">1/24</SelectItem>
                <SelectItem value="1/43">1/43</SelectItem>
                <SelectItem value="1/64">1/64</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-slate-300">Grade</Label>
            <Select
              value={values.grade ?? "any"}
              onValueChange={(v) => setSelect("grade", v)}
            >
              <SelectTrigger
                className={`bg-slate-700 border-slate-600 text-white ${
                  isActive(values.grade) ? ACTIVE_FILTER_CLASS : ""
                }`}
              >
                <SelectValue placeholder="Any grade" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700 text-white">
                <SelectItem value="any">Any</SelectItem>
                <SelectItem value="ungraded">Ungraded</SelectItem>
                {[10, 9, 8, 7, 6, 5, 4, 3, 2, 1].map((g) => (
                  <SelectItem key={g} value={String(g)}>
                    {g}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Details */}
      <div>
        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-4">
          Details
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="fp-serial-number" className="text-slate-300">Serial Number</Label>
            <Input
              id="fp-serial-number"
              type="number"
              placeholder="Exact match"
              value={values.serial_number ?? ""}
              onChange={(e) => setText("serial_number", e.target.value)}
              className={`bg-slate-700 border-slate-600 text-white placeholder:text-slate-500 ${
                isActive(values.serial_number) ? ACTIVE_FILTER_CLASS : ""
              }`}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="fp-production-count" className="text-slate-300">Production Count</Label>
            <Input
              id="fp-production-count"
              type="number"
              placeholder="Exact match"
              value={values.production_count ?? ""}
              onChange={(e) => setText("production_count", e.target.value)}
              className={`bg-slate-700 border-slate-600 text-white placeholder:text-slate-500 ${
                isActive(values.production_count) ? ACTIVE_FILTER_CLASS : ""
              }`}
            />
          </div>
        </div>
      </div>

      {/* Purchase */}
      <div>
        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-4">
          Purchase
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="fp-purchase-platform" className="text-slate-300">Purchase Platform</Label>
            <Input
              id="fp-purchase-platform"
              placeholder="e.g. eBay"
              value={values.purchase_platform ?? ""}
              onChange={(e) => setText("purchase_platform", e.target.value)}
              className={`bg-slate-700 border-slate-600 text-white placeholder:text-slate-500 ${
                isActive(values.purchase_platform) ? ACTIVE_FILTER_CLASS : ""
              }`}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="fp-purchase-price" className="text-slate-300">Purchase Price ($)</Label>
            <Input
              id="fp-purchase-price"
              type="number"
              placeholder="Exact match"
              value={values.purchase_price ?? ""}
              onChange={(e) => setText("purchase_price", e.target.value)}
              className={`bg-slate-700 border-slate-600 text-white placeholder:text-slate-500 ${
                isActive(values.purchase_price) ? ACTIVE_FILTER_CLASS : ""
              }`}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-slate-300">Purchase Year</Label>
            <Select
              value={values.purchase_year ?? "any"}
              onValueChange={(v) => setSelect("purchase_year", v)}
            >
              <SelectTrigger
                className={`bg-slate-700 border-slate-600 text-white ${
                  isActive(values.purchase_year) ? ACTIVE_FILTER_CLASS : ""
                }`}
              >
                <SelectValue placeholder="Any year" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700 text-white">
                <SelectItem value="any">Any</SelectItem>
                {years.map((y) => (
                  <SelectItem key={y} value={String(y)}>
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-slate-300">Purchase Month</Label>
            <Select
              value={values.purchase_month ?? "any"}
              onValueChange={(v) => setSelect("purchase_month", v)}
            >
              <SelectTrigger
                className={`bg-slate-700 border-slate-600 text-white ${
                  isActive(values.purchase_month) ? ACTIVE_FILTER_CLASS : ""
                }`}
              >
                <SelectValue placeholder="Any month" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700 text-white">
                <SelectItem value="any">Any</SelectItem>
                {MONTHS.map((m) => (
                  <SelectItem key={m.value} value={m.value}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-slate-300">Is Preorder</Label>
            <Select
              value={values.is_preorder ?? "any"}
              onValueChange={(v) => setSelect("is_preorder", v)}
            >
              <SelectTrigger
                className={`bg-slate-700 border-slate-600 text-white ${
                  isActive(values.is_preorder) ? ACTIVE_FILTER_CLASS : ""
                }`}
              >
                <SelectValue placeholder="Any" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700 text-white">
                <SelectItem value="any">Any</SelectItem>
                <SelectItem value="yes">Yes</SelectItem>
                <SelectItem value="no">No</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Received */}
      <div>
        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-4">
          Received
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <Label className="text-slate-300">Received Year</Label>
            <Select
              value={values.received_year ?? "any"}
              onValueChange={(v) => setSelect("received_year", v)}
            >
              <SelectTrigger
                className={`bg-slate-700 border-slate-600 text-white ${
                  isActive(values.received_year) ? ACTIVE_FILTER_CLASS : ""
                }`}
              >
                <SelectValue placeholder="Any year" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700 text-white">
                <SelectItem value="any">Any</SelectItem>
                {years.map((y) => (
                  <SelectItem key={y} value={String(y)}>
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-slate-300">Received Month</Label>
            <Select
              value={values.received_month ?? "any"}
              onValueChange={(v) => setSelect("received_month", v)}
            >
              <SelectTrigger
                className={`bg-slate-700 border-slate-600 text-white ${
                  isActive(values.received_month) ? ACTIVE_FILTER_CLASS : ""
                }`}
              >
                <SelectValue placeholder="Any month" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700 text-white">
                <SelectItem value="any">Any</SelectItem>
                {MONTHS.map((m) => (
                  <SelectItem key={m.value} value={m.value}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Sale */}
      <div>
        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-4">
          Sale
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <Label className="text-slate-300">Is Sold</Label>
            <Select
              value={values.is_sold ?? "any"}
              onValueChange={(v) => setSelect("is_sold", v)}
            >
              <SelectTrigger
                className={`bg-slate-700 border-slate-600 text-white ${
                  isActive(values.is_sold) ? ACTIVE_FILTER_CLASS : ""
                }`}
              >
                <SelectValue placeholder="Any" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700 text-white">
                <SelectItem value="any">Any</SelectItem>
                <SelectItem value="yes">Yes</SelectItem>
                <SelectItem value="no">No</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="fp-sold-price" className="text-slate-300">Sold Price ($)</Label>
            <Input
              id="fp-sold-price"
              type="number"
              placeholder="Exact match"
              value={values.sold_price ?? ""}
              onChange={(e) => setText("sold_price", e.target.value)}
              className={`bg-slate-700 border-slate-600 text-white placeholder:text-slate-500 ${
                isActive(values.sold_price) ? ACTIVE_FILTER_CLASS : ""
              }`}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="fp-sold-platform" className="text-slate-300">Sold Platform</Label>
            <Input
              id="fp-sold-platform"
              placeholder="e.g. eBay"
              value={values.sold_platform ?? ""}
              onChange={(e) => setText("sold_platform", e.target.value)}
              className={`bg-slate-700 border-slate-600 text-white placeholder:text-slate-500 ${
                isActive(values.sold_platform) ? ACTIVE_FILTER_CLASS : ""
              }`}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-slate-300">Sold Year</Label>
            <Select
              value={values.sold_year ?? "any"}
              onValueChange={(v) => setSelect("sold_year", v)}
            >
              <SelectTrigger
                className={`bg-slate-700 border-slate-600 text-white ${
                  isActive(values.sold_year) ? ACTIVE_FILTER_CLASS : ""
                }`}
              >
                <SelectValue placeholder="Any year" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700 text-white">
                <SelectItem value="any">Any</SelectItem>
                {years.map((y) => (
                  <SelectItem key={y} value={String(y)}>
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-slate-300">Sold Month</Label>
            <Select
              value={values.sold_month ?? "any"}
              onValueChange={(v) => setSelect("sold_month", v)}
            >
              <SelectTrigger
                className={`bg-slate-700 border-slate-600 text-white ${
                  isActive(values.sold_month) ? ACTIVE_FILTER_CLASS : ""
                }`}
              >
                <SelectValue placeholder="Any month" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700 text-white">
                <SelectItem value="any">Any</SelectItem>
                {MONTHS.map((m) => (
                  <SelectItem key={m.value} value={m.value}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 pt-2">
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
          className="border-slate-600 bg-slate-700 hover:bg-slate-600 text-slate-200"
        >
          <X className="h-4 w-4 mr-2" />
          Clear
        </Button>
      </div>
    </div>
  );
}
