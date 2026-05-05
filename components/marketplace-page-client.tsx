"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MarketplacePageClientProps {
  configPanel: React.ReactNode;
  children: React.ReactNode;
}

export function MarketplacePageClient({ configPanel, children }: MarketplacePageClientProps) {
  const [configOpen, setConfigOpen] = useState(false);

  return (
    <div className="space-y-6">
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

      {/* Listings grid */}
      {children}
    </div>
  );
}
