"use client";

import { useOptimistic, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { deleteItem } from "@/lib/actions/items";
import { ItemCard } from "@/components/item-card";

type ItemLike = {
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
  is_sold: boolean;
};

interface CollectionGridProps {
  items: ItemLike[];
}

export function CollectionGrid({ items }: CollectionGridProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [optimisticItems, removeOptimistically] = useOptimistic(
    items,
    (state: ItemLike[], deletedId: string) =>
      state.filter((item) => item.id !== deletedId)
  );

  function handleDelete(id: string) {
    startTransition(async () => {
      removeOptimistically(id);
      const result = await deleteItem(id);
      if (result?.success) {
        toast.success("Item deleted");
        router.refresh();
      } else if (result?.error) {
        toast.error(result.error);
        router.refresh();
      }
    });
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {optimisticItems.map((item) => (
        <ItemCard key={item.id} item={item} onDelete={handleDelete} />
      ))}
    </div>
  );
}
