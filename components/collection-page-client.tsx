"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Filter, ChevronDown, ChevronUp, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SortControls } from "@/components/sort-controls";
import { FilterPanel, type FilterValues } from "@/components/filter-panel";

const FILTER_KEY_LABELS: { key: keyof FilterValues; label: string }[] = [
  { key: "brand", label: "Brand" },
  { key: "make", label: "Make" },
  { key: "model", label: "Model" },
  { key: "variant", label: "Variant" },
  { key: "scale", label: "Scale" },
  { key: "grade", label: "Grade" },
  { key: "serial_number", label: "Serial Number" },
  { key: "production_count", label: "Production Count" },
  { key: "purchase_platform", label: "Purchase Platform" },
  { key: "purchase_price", label: "Purchase Price" },
  { key: "purchase_year", label: "Purchase Year" },
  { key: "purchase_month", label: "Purchase Month" },
  { key: "is_preorder", label: "Is Preorder" },
  { key: "received_year", label: "Received Year" },
  { key: "received_month", label: "Received Month" },
  { key: "is_sold", label: "Is Sold" },
  { key: "sold_price", label: "Sold Price" },
  { key: "sold_platform", label: "Sold Platform" },
  { key: "sold_year", label: "Sold Year" },
  { key: "sold_month", label: "Sold Month" },
];

function isActive(val: string | undefined): boolean {
  return Boolean(val && val !== "" && val !== "any");
}

interface SummaryData {
  matchedCount: number;
  totalPurchaseValue: number;
  totalSoldValue: number;
}

interface CollectionPageClientProps {
  sortParam: string;
  dirParam: string;
  searchParams: Record<string, string>;
  collectingSinceYear: number;
  activeFilters: FilterValues;
  summaryData: SummaryData | null;
  children: React.ReactNode;
}

export function CollectionPageClient({
  sortParam,
  dirParam,
  searchParams,
  collectingSinceYear,
  activeFilters,
  summaryData,
  children,
}: CollectionPageClientProps) {
  // Filter panel always starts closed on page load
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  const activeTags = FILTER_KEY_LABELS.filter(({ key }) => isActive(activeFilters[key]));
  const hasActiveFilter = activeTags.length > 0;

  function buildFilterUrl(filters: FilterValues): string {
    const params = new URLSearchParams();
    // Carry sort params; reset page to 1
    if (searchParams.sort) params.set("sort", searchParams.sort);
    if (searchParams.dir) params.set("dir", searchParams.dir);
    // Add active filter values
    for (const [key, value] of Object.entries(filters)) {
      if (isActive(value)) {
        params.set(key, value!);
      }
    }
    const qs = params.toString();
    return qs ? `/?${qs}` : "/";
  }

  function handleApply(filters: FilterValues) {
    setIsOpen(false);
    router.push(buildFilterUrl(filters));
  }

  function handleClear() {
    setIsOpen(false);
    // Keep only sort params, remove all filters
    const params = new URLSearchParams();
    if (searchParams.sort) params.set("sort", searchParams.sort);
    if (searchParams.dir) params.set("dir", searchParams.dir);
    const qs = params.toString();
    router.push(qs ? `/?${qs}` : "/");
  }

  function handleRemoveTag(key: keyof FilterValues) {
    const newFilters = { ...activeFilters };
    delete newFilters[key];
    router.push(buildFilterUrl(newFilters));
  }

  return (
    <div className="space-y-4">
      {/* Action bar */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h1 className="text-2xl font-bold text-white">My Collection</h1>
        <div className="flex items-center gap-2">
          <SortControls
            currentSort={sortParam}
            currentDir={dirParam}
            searchParams={searchParams}
          />
          <Button
            variant="outline"
            onClick={() => setIsOpen((prev) => !prev)}
            className="h-9 bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700"
          >
            <Filter className="h-4 w-4 mr-2" />
            Filter
            {isOpen ? (
              <ChevronUp className="h-4 w-4 ml-2" />
            ) : (
              <ChevronDown className="h-4 w-4 ml-2" />
            )}
          </Button>
          <Button asChild className="bg-blue-600 hover:bg-blue-700 text-white">
            <Link href="/items/new">
              <Plus className="h-4 w-4 mr-2" />
              Add Item
            </Link>
          </Button>
        </div>
      </div>

      {/* Summary bar — always visible above filter panel when filters are active */}
      {summaryData && (
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 flex flex-wrap gap-6 items-center">
          <div className="flex flex-col">
            <span className="text-xs text-slate-400 uppercase tracking-wide">Matched Items</span>
            <span className="text-2xl font-bold text-white">{summaryData.matchedCount}</span>
          </div>
          <div className="w-px h-10 bg-slate-700 hidden sm:block" />
          <div className="flex flex-col">
            <span className="text-xs text-slate-400 uppercase tracking-wide">Total Purchase Value</span>
            <span className="text-2xl font-bold text-blue-400">${summaryData.totalPurchaseValue.toLocaleString()}</span>
          </div>
          <div className="w-px h-10 bg-slate-700 hidden sm:block" />
          <div className="flex flex-col">
            <span className="text-xs text-slate-400 uppercase tracking-wide">Total Sale Value</span>
            <span className="text-2xl font-bold text-green-400">${summaryData.totalSoldValue.toLocaleString()}</span>
          </div>
        </div>
      )}

      {/* Filter tag bar — visible when panel is closed and filters are active */}
      {!isOpen && hasActiveFilter && (
        <div className="flex flex-wrap gap-2">
          {activeTags.map(({ key, label }) => (
            <span
              key={key}
              className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-700 text-slate-200 text-xs rounded-md border border-slate-600"
            >
              {label}
              <button
                onClick={() => handleRemoveTag(key)}
                className="text-slate-400 hover:text-white ml-0.5 leading-none"
                aria-label={`Remove ${label} filter`}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Filter panel — visible when isOpen */}
      <FilterPanel
        isOpen={isOpen}
        collectingSinceYear={collectingSinceYear}
        activeFilters={activeFilters}
        onApply={handleApply}
        onClear={handleClear}
      />

      {/* Collection grid (server-rendered children) */}
      {children}
    </div>
  );
}
