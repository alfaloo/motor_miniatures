"use client";

import { useState } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Share2, Copy, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ShareLinkModalProps {
  username: string;
}

export function ShareLinkModal({ username }: ShareLinkModalProps) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const url =
    typeof window !== "undefined"
      ? `${window.location.origin}/store/${username}`
      : `/store/${username}`;

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard not available
    }
  }

  return (
    <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
      <DialogPrimitive.Trigger asChild>
        <Button
          variant="outline"
          className="h-9 bg-card border-border text-foreground hover:bg-secondary gap-1.5"
        >
          <Share2 className="h-4 w-4" />
          Share storefront
        </Button>
      </DialogPrimitive.Trigger>

      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content className="fixed left-[50%] top-[50%] z-50 w-full max-w-md translate-x-[-50%] translate-y-[-50%] rounded-lg border border-border bg-card p-6 shadow-lg data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95">
          <div className="flex items-start justify-between gap-4">
            <DialogPrimitive.Title className="text-lg font-semibold text-foreground">
              Your storefront link
            </DialogPrimitive.Title>
            <DialogPrimitive.Close asChild>
              <button
                type="button"
                className="rounded-sm text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </DialogPrimitive.Close>
          </div>

          <div className="mt-4 flex gap-2">
            <input
              type="text"
              readOnly
              value={url}
              className="flex-1 rounded-md border border-border bg-secondary px-3 py-2 text-sm text-foreground select-all focus:outline-none"
              onFocus={(e) => e.target.select()}
            />
            <Button
              variant="outline"
              className={
                copied
                  ? "border-border bg-secondary text-green-400 gap-1.5 hover:bg-black/15"
                  : "border-border bg-secondary hover:bg-black/15 text-foreground gap-1.5"
              }
              onClick={handleCopy}
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  Copy link
                </>
              )}
            </Button>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
