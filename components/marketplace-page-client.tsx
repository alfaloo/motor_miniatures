"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronUp, Settings2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ShareLinkModal } from "@/components/share-link-modal";
import { SelectionContext } from "@/components/marketplace-selection-context";
import type { SelectionState } from "@/components/marketplace-selection-context";

interface MarketplacePageClientProps {
  configPanel: React.ReactNode;
  children: React.ReactNode;
  username: string;
}

export function MarketplacePageClient({
  configPanel,
  children,
  username,
}: MarketplacePageClientProps) {
  const [configOpen, setConfigOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [selectionState, setSelectionState] = useState<SelectionState>({ active: false });

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

  const isSelecting = selectionState.active;
  const selectedCount = isSelecting ? selectionState.selectedIds.size : 0;

  function handleSelectClick() {
    if (!isSelecting) {
      setSelectionState({ active: true, selectedIds: new Set(), pendingStatus: null });
      // Radix will call onOpenChange(true) automatically to open the dropdown
    }
    // When already active: T8 will add commit logic; Radix handles dropdown toggle
  }

  function handleDropdownOpenChange(open: boolean) {
    setDropdownOpen(open);
    // Closing the dropdown does NOT exit selection mode — cards remain selectable
  }

  return (
    <SelectionContext.Provider value={{ selectionState, toggleId }}>
      <div className="space-y-6">
        {/* Top bar */}
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-2xl font-bold text-foreground">Marketplace</h1>
          <div className="flex items-center gap-2">
            <ShareLinkModal username={username} />

            <DropdownMenu open={dropdownOpen} onOpenChange={handleDropdownOpenChange}>
              <DropdownMenuTrigger asChild onClick={handleSelectClick}>
                <Button
                  variant="outline"
                  className={
                    isSelecting
                      ? "ring-2 ring-amber-400 ring-offset-0 text-amber-600 dark:text-amber-400 gap-1.5"
                      : ""
                  }
                >
                  Select
                  {isSelecting && <ChevronDown className="h-4 w-4" />}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuLabel className="font-normal text-muted-foreground">
                  {selectedCount} listings selected
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>Mark as Active</DropdownMenuItem>
                <DropdownMenuItem>Mark as Sold Out</DropdownMenuItem>
                <DropdownMenuItem>Mark as Retired</DropdownMenuItem>
                <DropdownMenuItem>Mark as Pre-order</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Link href="/marketplace/listings/new">
              <Button className="gap-1.5">
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
              <span className="font-medium text-foreground">Configure Add-Ons</span>
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

        {/* Listings grid + pagination */}
        {children}
      </div>
    </SelectionContext.Provider>
  );
}
