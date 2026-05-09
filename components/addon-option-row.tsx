"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Pencil, Trash2, Check, X, GripVertical } from "lucide-react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { updateOption, deleteOption, forceDeleteOption } from "@/lib/actions/addons";
import { AddonDeleteWarning } from "@/components/addon-delete-warning";

interface AffectedListing {
  id: string;
  title: string;
}

interface AddonOptionRowProps {
  option: {
    id: string;
    name: string;
    price: number;
  };
  onUpdate?: (name: string, price: number) => void;
  onDelete?: () => void;
}

export function AddonOptionRow({ option, onUpdate, onDelete }: AddonOptionRowProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(option.name);
  const [editPrice, setEditPrice] = useState(String(option.price));
  const [editError, setEditError] = useState<string | null>(null);

  const [warningOpen, setWarningOpen] = useState(false);
  const [affectedListings, setAffectedListings] = useState<AffectedListing[]>([]);
  const [isForceDeleting, startForceDeleteTransition] = useTransition();

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: option.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  function handleEditStart() {
    setEditName(option.name);
    setEditPrice(String(option.price));
    setEditError(null);
    setIsEditing(true);
  }

  function handleEditCancel() {
    setIsEditing(false);
    setEditError(null);
  }

  function handleEditSave() {
    const price = parseInt(editPrice, 10);
    if (!editName.trim()) {
      setEditError("Name is required");
      return;
    }
    if (isNaN(price) || price < 0) {
      setEditError("Price must be a non-negative integer");
      return;
    }

    startTransition(async () => {
      const result = await updateOption(option.id, editName.trim(), price);
      if ("error" in result) {
        setEditError((result as { error: string }).error);
      } else {
        setIsEditing(false);
        setEditError(null);
        onUpdate?.(editName.trim(), price);
        toast.success("Option updated");
        router.refresh();
      }
    });
  }

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteOption(option.id);
      if ("error" in result) {
        // silently ignore ownership errors
      } else if ("affected" in result) {
        setAffectedListings(result.affected);
        setWarningOpen(true);
      } else {
        toast.success("Option deleted");
        onDelete?.();
        router.refresh();
      }
    });
  }

  function handleForceDelete() {
    startForceDeleteTransition(async () => {
      await forceDeleteOption(option.id);
      setWarningOpen(false);
      toast.success("Option deleted");
      onDelete?.();
      router.refresh();
    });
  }

  if (isEditing) {
    return (
      <div ref={setNodeRef} style={style} className="flex flex-col gap-1.5 py-1">
        <div className="flex items-center gap-2">
          <Input
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            placeholder="Option name"
            className="h-8 text-sm bg-secondary border-border flex-1 min-w-0"
            disabled={isPending}
          />
          <Input
            type="number"
            value={editPrice}
            onChange={(e) => setEditPrice(e.target.value)}
            placeholder="Price"
            min="0"
            step="1"
            className="h-8 text-sm bg-secondary border-border w-24"
            disabled={isPending}
          />
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-green-400 hover:text-green-300 hover:bg-green-900/20 shrink-0"
            onClick={handleEditSave}
            disabled={isPending}
          >
            <Check className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground shrink-0"
            onClick={handleEditCancel}
            disabled={isPending}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        {editError && <p className="text-xs text-red-400">{editError}</p>}
      </div>
    );
  }

  return (
    <>
      <div ref={setNodeRef} style={style} className="flex items-center gap-2 py-1 group">
        <button
          type="button"
          className="text-muted-foreground/40 hover:text-muted-foreground shrink-0 cursor-grab active:cursor-grabbing touch-none"
          {...attributes}
          {...listeners}
          tabIndex={-1}
        >
          <GripVertical className="h-4 w-4" />
        </button>
        <span className="flex-1 text-sm text-foreground">{option.name}</span>
        <span className="text-sm text-muted-foreground tabular-nums">
          {option.price}
        </span>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-foreground"
            onClick={handleEditStart}
            disabled={isPending}
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-red-400/70 hover:text-red-400 hover:bg-red-900/20"
            onClick={handleDelete}
            disabled={isPending}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      <AddonDeleteWarning
        open={warningOpen}
        onClose={() => setWarningOpen(false)}
        affected={affectedListings}
        onConfirm={handleForceDelete}
        isPending={isForceDeleting}
      />
    </>
  );
}
