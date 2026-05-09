"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronUp, Settings2, Plus, Loader2, Filter } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ShareLinkModal } from "@/components/share-link-modal";
import { SelectionContext } from "@/components/marketplace-selection-context";
import type { SelectionState, ListingStatus } from "@/components/marketplace-selection-context";
import { bulkUpdateListingStatus } from "@/lib/actions/marketplace";
import { MarketplaceFilterPanel, type MarketplaceFilterValues } from "@/components/marketplace-filter-panel";

const STATUS_LABELS: Record<ListingStatus, string> = {
  active: "Mark as Active",
  sold_out: "Mark as Sold Out",
  retired: "Mark as Retired",
  pre_order: "Mark as Pre-order",
  unpublished: "Mark as Unpublished",
};

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

function buildFilterUrl(filters: MarketplaceFilterValues): string {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(filters)) {
    if (isActive(v)) params.set(k, v!);
  }
  const qs = params.toString();
  return qs ? `/marketplace?${qs}` : "/marketplace";
}

interface MarketplacePageClientProps {
  configPanel: React.ReactNode;
  children: React.ReactNode;
  username: string;
  activeFilters: MarketplaceFilterValues;
  filterOptions: { brands: string[]; makes: string[]; scales: string[]; availabilities: string[]; statuses: string[] };
  listingCount: number;
}

export function MarketplacePageClient({
  configPanel,
  children,
  username,
  activeFilters,
  filterOptions,
  listingCount,
}: MarketplacePageClientProps) {
  const router = useRouter();
  const [configOpen, setConfigOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectionState, setSelectionState] = useState<SelectionState>({ active: false });
  const [isCommitting, setIsCommitting] = useState(false);

  const hasActiveFilters = FILTER_KEY_LABELS.some(({ key }) => isActive(activeFilters[key]));

  function handleApply(values: MarketplaceFilterValues) {
    router.push(buildFilterUrl(values));
    setFilterOpen(false);
  }

  function handleClear() {
    router.push("/marketplace");
    setFilterOpen(false);
  }

  function handleRemoveTag(key: keyof MarketplaceFilterValues) {
    const next = { ...activeFilters, [key]: undefined };
    router.push(buildFilterUrl(next));
  }

  function toggleId(id: string) {
    if (!selectionState.active) return;
    setSelectionState((prev) => {
      if (!prev.active) return prev;
      const next = new Set(prev.selectedIds);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return { ...prev, selectedIds: next };
    });
  }

  function setPendingStatus(status: ListingStatus) {
    setSelectionState((prev) => {
      if (!prev.active) return prev;
      return { ...prev, pendingStatus: status };
    });
  }

  function clearPendingStatus() {
    setSelectionState((prev) => {
      if (!prev.active) return prev;
      return { ...prev, pendingStatus: null };
    });
  }

  const isSelecting = selectionState.active;
  const selectedCount = isSelecting ? selectionState.selectedIds.size : 0;
  const pendingStatus = isSelecting ? selectionState.pendingStatus : null;

  async function handleSelectClick() {
    if (!isSelecting) {
      setSelectionState({ active: true, selectedIds: new Set(), pendingStatus: null });
      return;
    }

    // Already active: commit or exit
    if (pendingStatus !== null && selectedCount > 0) {
      const ids = [...(selectionState as Extract<SelectionState, { active: true }>).selectedIds];
      setIsCommitting(true);
      try {
        const result = await bulkUpdateListingStatus(ids, pendingStatus);
        if (result.success) {
          toast.success(`${ids.length} listing${ids.length === 1 ? "" : "s"} updated`);
          setSelectionState({ active: false });
          router.refresh();
        } else {
          toast.error(result.error ?? "Failed to update listings");
        }
      } catch {
        toast.error("Failed to update listings");
      } finally {
        setIsCommitting(false);
      }
    } else {
      setSelectionState({ active: false });
    }
  }

  return (
    <SelectionContext.Provider value={{ selectionState, toggleId }}>
      <div className="space-y-6">
        {/* Top bar */}
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-2xl font-bold text-foreground">Marketplace</h1>
          <div className="flex items-center gap-2">
            <ShareLinkModal username={username} />

            {/* Select button + custom panel (no Radix overlay — card clicks pass through) */}
            <div className="relative">
              <Button
                variant="outline"
                disabled={isCommitting}
                onClick={handleSelectClick}
                className={
                  isSelecting
                    ? "h-9 bg-card border-border hover:bg-secondary gap-1.5 ring-2 ring-amber-400 ring-offset-0 text-amber-600 dark:text-amber-400"
                    : "h-9 bg-card border-border text-foreground hover:bg-secondary gap-1.5"
                }
              >
                {isCommitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    Select
                    {isSelecting && <ChevronDown className="h-4 w-4" />}
                  </>
                )}
              </Button>

              {isSelecting && (
                <div className="absolute right-0 top-full mt-1 z-50 w-52 rounded-md border border-border bg-popover shadow-md py-1">
                  <button
                    type="button"
                    onClick={clearPendingStatus}
                    className="w-full text-left px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground"
                  >
                    {selectedCount} listing{selectedCount === 1 ? "" : "s"} selected
                  </button>
                  <div className="h-px bg-border my-1" />
                  {(Object.entries(STATUS_LABELS) as [ListingStatus, string][]).map(([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setPendingStatus(value)}
                      className={[
                        "w-full text-left px-3 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground",
                        pendingStatus === value ? "text-amber-600 dark:text-amber-400 font-medium" : "text-foreground",
                      ].join(" ")}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Filter button */}
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

            <Link href="/marketplace/listings/new">
              <Button className="h-9 gap-1.5 bg-blue-600 hover:bg-blue-700 text-white">
                <Plus className="h-4 w-4" />
                New listing
              </Button>
            </Link>
          </div>
        </div>

        {/* Add-on configuration collapsible section */}
        <div className="bg-card border border-border rounded-xl">
          <button
            type="button"
            onClick={() => setConfigOpen((prev) => !prev)}
            className="w-full flex items-center justify-between p-4 sm:p-6 text-left"
          >
            <div className="flex items-center gap-2">
              <Settings2 className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium text-foreground">Configure</span>
            </div>
            {configOpen ? (
              <ChevronUp className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            )}
          </button>

          {configOpen && (
            <div className="px-4 pb-4 sm:px-6 sm:pb-6 border-t border-border pt-4">
              {configPanel}
            </div>
          )}
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
        />

        {/* Listings grid + pagination OR zero-results empty state */}
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
    </SelectionContext.Provider>
  );
}
