"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface AffectedListing {
  id: string;
  title: string;
}

interface AddonDeleteWarningProps {
  open: boolean;
  onClose: () => void;
  affected: AffectedListing[];
  onConfirm: () => void | Promise<void>;
  isPending?: boolean;
}

export function AddonDeleteWarning({
  open,
  onClose,
  affected,
  onConfirm,
  isPending = false,
}: AddonDeleteWarningProps) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content className="fixed left-[50%] top-[50%] z-50 w-full max-w-md translate-x-[-50%] translate-y-[-50%] rounded-lg border border-border bg-card p-6 shadow-lg data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95">
          <DialogPrimitive.Title className="text-lg font-semibold text-foreground">
            Delete will affect active listings
          </DialogPrimitive.Title>
          <DialogPrimitive.Description className="mt-2 text-sm text-muted-foreground">
            The following listings use this add-on. Deleting it will remove the
            add-on from all of them and recompute their totals.
          </DialogPrimitive.Description>

          <ul className="mt-4 max-h-48 overflow-y-auto space-y-1 rounded-md border border-border bg-secondary p-3">
            {affected.map((listing) => (
              <li key={listing.id}>
                <Link
                  href={`/marketplace/listings/${listing.id}`}
                  className="text-sm text-blue-400 hover:underline"
                  target="_blank"
                >
                  {listing.title}
                </Link>
              </li>
            ))}
          </ul>

          <div className="mt-6 flex justify-end gap-2">
            <Button
              variant="outline"
              className="border-border bg-secondary hover:bg-black/15 text-foreground"
              onClick={onClose}
              disabled={isPending}
            >
              Back
            </Button>
            <Button
              variant="outline"
              className="border-red-900 bg-secondary hover:bg-red-900/30 text-red-400"
              onClick={onConfirm}
              disabled={isPending}
            >
              {isPending ? "Deleting…" : "Confirm Delete"}
            </Button>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
