"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronUp, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MarketplaceFilterPanel, type MarketplaceFilterValues } from "@/components/marketplace-filter-panel";

const FILTER_KEY_LABELS: { key: keyof MarketplaceFilterValues; label: string }[] = [
  { key: "brand", label: "Brand" },
  { key: "make", label: "Make" },
  { key: "scale", label: "Scale" },
  { key: "availability", label: "Availability" },
  { key: "status", label: "Status" },
];

function isActive(v: string | undefined): boolean {
  return Boolean(v && v !== "any" && v !== "");
}

function buildFilterUrl(username: string, filters: MarketplaceFilterValues): string {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(filters)) {
    if (isActive(v)) params.set(k, v!);
  }
  const qs = params.toString();
  return qs ? `/store/${username}?${qs}` : `/store/${username}`;
}

interface StorefrontPageClientProps {
  username: string;
  activeFilters: MarketplaceFilterValues;
  filterOptions: { brands: string[]; makes: string[]; scales: string[]; availabilities: string[]; statuses: string[] };
  listingCount: number;
  children: React.ReactNode;
}

export function StorefrontPageClient({
  username,
  activeFilters,
  filterOptions,
  listingCount,
  children,
}: StorefrontPageClientProps) {
  const router = useRouter();
  const [filterOpen, setFilterOpen] = useState(false);

  const hasActiveFilters = FILTER_KEY_LABELS.some(({ key }) => isActive(activeFilters[key]));

  function handleApply(values: MarketplaceFilterValues) {
    router.push(buildFilterUrl(username, values));
    setFilterOpen(false);
  }

  function handleClear() {
    router.push(`/store/${username}`);
    setFilterOpen(false);
  }

  function handleRemoveTag(key: keyof MarketplaceFilterValues) {
    const next = { ...activeFilters, [key]: undefined };
    router.push(buildFilterUrl(username, next));
  }

  return (
    <div className="space-y-6">
      {/* Filter button */}
      <div className="flex justify-end">
        <Button
          variant="outline"
          onClick={() => setFilterOpen((p) => !p)}
          className="h-9 bg-card border-border text-foreground hover:bg-secondary gap-1.5"
        >
          <Filter className="h-4 w-4" />
          <span className="hidden sm:inline">Filter</span>
          {filterOpen ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Filter tag strip — visible when panel is closed and filters are active */}
      {!filterOpen && hasActiveFilters && (
        <div className="flex flex-wrap gap-2">
          {FILTER_KEY_LABELS.filter(({ key }) => isActive(activeFilters[key])).map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => handleRemoveTag(key)}
              className="inline-flex items-center gap-1 px-2.5 py-1 bg-secondary text-foreground text-xs rounded-md border border-border"
            >
              {label} ×
            </button>
          ))}
        </div>
      )}

      {/* Filter panel */}
      <MarketplaceFilterPanel
        isOpen={filterOpen}
        activeFilters={activeFilters}
        options={filterOptions}
        onApply={handleApply}
        onClear={handleClear}
        showStatus={true}
      />

      {/* Listings grid OR zero-results empty state */}
      {listingCount === 0 && hasActiveFilters ? (
        <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
          <p className="text-muted-foreground">No listings match your filters</p>
          <Button variant="outline" onClick={handleClear}>
            Clear Filters
          </Button>
        </div>
      ) : (
        children
      )}
    </div>
  );
}
