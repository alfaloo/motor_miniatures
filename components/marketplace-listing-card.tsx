"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Pencil, Trash2 } from "lucide-react";
import { formatPrice } from "@/lib/currency";
import { deleteListing } from "@/lib/actions/marketplace";
import type { ListingWithAddonCount } from "@/lib/actions/marketplace";

interface MarketplaceListingCardProps {
  listing: ListingWithAddonCount;
  currency: string;
  vendorMode: boolean;
  detailHref?: string;
}

export function MarketplaceListingCard({
  listing,
  currency,
  vendorMode,
  detailHref,
}: MarketplaceListingCardProps) {
  const router = useRouter();

  async function handleDelete() {
    await deleteListing(listing.id);
    toast.success("Listing deleted");
    router.refresh();
  }

  return (
    <div
      className={`rounded-xl border border-border bg-card p-4 flex flex-col gap-3${detailHref ? " hover:border-blue-500 transition cursor-pointer" : ""}`}
      onClick={detailHref ? () => router.push(detailHref) : undefined}
    >
      {/* Top row: brand + scale */}
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium text-foreground">{listing.brand}</span>
        <Badge variant="outline" className="border-border text-muted-foreground text-xs">
          {listing.scale}
        </Badge>
      </div>

      {/* Model name + variant */}
      <div>
        <h3 className="font-semibold text-foreground leading-tight">
          {listing.make} {listing.model}
        </h3>
        <p className="text-sm text-muted-foreground mt-0.5">{listing.variant}</p>
      </div>

      <Separator className="bg-border" />

      {/* Bottom metadata: preorder badge + price */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {listing.is_made_to_order ? (
            <Badge className="bg-amber-600 hover:bg-amber-600 text-white text-xs">
              Made to Order
            </Badge>
          ) : (
            <Badge className="bg-green-600 hover:bg-green-600 text-white text-xs">
              Ready Stock
            </Badge>
          )}
        </div>
        <span className="text-xs text-muted-foreground">
          {formatPrice(listing.total_price, currency)}
        </span>
      </div>

      {/* Vendor action buttons */}
      {vendorMode && (
        <div className="flex items-center gap-2 pt-1 mt-auto">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 min-w-0 border-border bg-secondary hover:bg-black/15 text-foreground text-xs h-8"
            onClick={(e) => { e.stopPropagation(); router.push(`/marketplace/listings/${listing.id}/edit`); }}
          >
            <Pencil className="h-3 w-3 mr-1" />
            Edit
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="flex-1 min-w-0 border-red-900 bg-secondary hover:bg-red-900/30 text-red-400 text-xs h-8"
                onClick={(e) => e.stopPropagation()}
              >
                <Trash2 className="h-3 w-3 mr-1" />
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="bg-card border border-border">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-foreground">Delete listing?</AlertDialogTitle>
                <AlertDialogDescription className="text-muted-foreground">
                  Are you sure you want to delete this listing? This cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel
                  className="border-border bg-secondary hover:bg-black/15 text-foreground"
                  onClick={(e) => e.stopPropagation()}
                >
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={(e) => { e.stopPropagation(); handleDelete(); }}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )}
    </div>
  );
}
