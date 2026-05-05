"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
}

export function MarketplaceListingCard({
  listing,
  currency,
  vendorMode,
}: MarketplaceListingCardProps) {
  const router = useRouter();

  async function handleDelete() {
    await deleteListing(listing.id);
    router.refresh();
  }

  return (
    <div className="bg-card border border-border rounded-xl p-4 sm:p-6 flex flex-col gap-3">
      {/* Heading: Brand Make Model Variant */}
      <div>
        <h3 className="font-semibold text-foreground leading-tight">
          {listing.brand} {listing.make} {listing.model}
        </h3>
        <p className="text-sm text-muted-foreground mt-0.5">{listing.variant}</p>
      </div>

      {/* Badges row */}
      <div className="flex items-center gap-2 flex-wrap">
        <Badge className="bg-blue-600 hover:bg-blue-600 text-white text-xs">
          {listing.scale}
        </Badge>
        {listing.is_preorder && (
          <Badge className="bg-amber-600 hover:bg-amber-600 text-white text-xs">
            Pre-order
          </Badge>
        )}
      </div>

      {/* Total price */}
      <div className="text-sm font-medium text-foreground mt-auto">
        {formatPrice(listing.total_price, currency)}
      </div>

      {/* Vendor action buttons */}
      {vendorMode && (
        <div className="flex items-center gap-2 pt-1">
          <Link href={`/marketplace/listings/${listing.id}/edit`} className="flex-1">
            <Button
              variant="outline"
              size="sm"
              className="w-full border-border bg-secondary hover:bg-black/15 text-foreground text-xs h-8"
            >
              <Pencil className="h-3 w-3 mr-1" />
              Edit
            </Button>
          </Link>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="flex-1 border-red-900 bg-secondary hover:bg-red-900/30 text-red-400 text-xs h-8"
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
                <AlertDialogCancel className="border-border bg-secondary hover:bg-black/15 text-foreground">
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
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
