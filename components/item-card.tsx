"use client";

import { useRouter } from "next/navigation";
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
import { Pencil, Trash2, PackageCheck } from "lucide-react";

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

interface ItemCardProps {
  item: {
    id: string;
    brand: string;
    make: string;
    model: string;
    variant: string;
    scale: string;
    grade: number | null;
    purchase_year: number;
    purchase_month: number;
    is_preorder: boolean;
    received_year: number | null;
    received_month: number | null;
    is_sold: boolean;
  };
  onDelete?: (id: string) => void;
  onAcquire?: (id: string) => void;
}

export function ItemCard({ item, onDelete, onAcquire }: ItemCardProps) {
  const router = useRouter();
  const purchasedLabel = `${MONTHS[item.purchase_month - 1]} ${item.purchase_year}`;
  const showPreorder = item.is_preorder && (item.received_year === null || item.received_month === null);

  function handleDelete() {
    if (onDelete) {
      onDelete(item.id);
    }
  }

  function handleAcquire() {
    if (onAcquire) {
      onAcquire(item.id);
    }
  }

  return (
    <div
      className="rounded-xl border border-border bg-card hover:border-blue-500 transition p-4 flex flex-col gap-3 cursor-pointer"
      onClick={() => router.push(`/items/${item.id}`)}
    >
      {/* Top row: brand + scale */}
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium text-foreground">{item.brand}</span>
        <Badge variant="outline" className="border-border text-muted-foreground text-xs">
          {item.scale}
        </Badge>
      </div>

      {/* Model name */}
      <div>
        <h3 className="font-semibold text-foreground leading-tight">{item.model}</h3>
        <p className="text-sm text-muted-foreground mt-0.5">{item.variant}</p>
      </div>

      <Separator className="bg-border" />

      {/* Grade + purchased */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {item.grade !== null ? (
            <Badge className="bg-blue-600 hover:bg-blue-600 text-white text-xs">
              Grade {item.grade}
            </Badge>
          ) : (
            <Badge variant="outline" className="border-border text-muted-foreground text-xs">
              Ungraded
            </Badge>
          )}
        </div>
        <span className="text-xs text-muted-foreground">{purchasedLabel}</span>
      </div>

      {/* Status badges */}
      {(showPreorder || item.is_sold) && (
        <div className="flex items-center gap-2 flex-wrap">
          {showPreorder && (
            <Badge className="bg-amber-600 hover:bg-amber-600 text-white text-xs">
              Preorder
            </Badge>
          )}
          {item.is_sold && (
            <Badge className="bg-green-600 hover:bg-green-600 text-white text-xs">
              Sold
            </Badge>
          )}
        </div>
      )}

      {/* Action row */}
      <div className="flex items-center gap-2 pt-1 mt-auto">
        {onAcquire && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="flex-1 min-w-0 border-border bg-secondary hover:bg-black/15 text-foreground text-xs h-8"
                onClick={(e) => e.stopPropagation()}
              >
                <PackageCheck className="h-3 w-3 mr-1" />
                Acquire
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="bg-card border border-border">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-foreground">Move to Collection?</AlertDialogTitle>
                <AlertDialogDescription className="text-muted-foreground">
                  This will move {item.brand} {item.make} {item.model} to your main collection. All data will be kept as-is.
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
                  onClick={(e) => { e.stopPropagation(); handleAcquire(); }}
                  className="bg-teal-600 hover:bg-teal-700 text-white"
                >
                  Acquire
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
        <Button
          variant="outline"
          size="sm"
          className="flex-1 min-w-0 border-border bg-secondary hover:bg-black/15 text-foreground text-xs h-8"
          onClick={(e) => { e.stopPropagation(); router.push(`/items/${item.id}/edit`); }}
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
              <AlertDialogTitle className="text-foreground">Delete item?</AlertDialogTitle>
              <AlertDialogDescription className="text-muted-foreground">
                Are you sure you want to delete this item? This cannot be undone.
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
    </div>
  );
}
