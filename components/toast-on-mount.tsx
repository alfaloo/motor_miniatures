"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";

const TOAST_MESSAGES: Record<string, { type: "success" | "error"; message: string }> = {
  item_created: { type: "success", message: "Item created successfully" },
  item_updated: { type: "success", message: "Item updated successfully" },
  item_deleted: { type: "success", message: "Item deleted" },
  comment_deleted: { type: "success", message: "Comment deleted" },
};

interface ToastOnMountProps {
  toastKey?: string;
}

export function ToastOnMount({ toastKey }: ToastOnMountProps) {
  const shownRef = useRef<string | null>(null);

  useEffect(() => {
    if (!toastKey || shownRef.current === toastKey) return;
    const entry = TOAST_MESSAGES[toastKey];
    if (!entry) return;
    shownRef.current = toastKey;
    if (entry.type === "success") {
      toast.success(entry.message);
    } else {
      toast.error(entry.message);
    }
  }, [toastKey]);

  return null;
}
