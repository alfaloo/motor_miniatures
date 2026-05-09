"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Pencil, Trash2, Check, X, ChevronDown, ChevronRight, GripVertical } from "lucide-react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { updateCategory, deleteCategory, forceDeleteCategory } from "@/lib/actions/addons";
import { AddonDeleteWarning } from "@/components/addon-delete-warning";

interface AffectedListing {
  id: string;
  title: string;
}

interface AddonCategoryRowProps {
  category: {
    id: string;
    name: string;
  };
  isOpen: boolean;
  onToggle: () => void;
  onDelete?: () => void;
  children?: React.ReactNode;
}

export function AddonCategoryRow({
  category,
  isOpen,
  onToggle,
  onDelete,
  children,
}: AddonCategoryRowProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(category.name);
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
  } = useSortable({ id: category.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : undefined,
  };

  function handleEditStart(e: React.MouseEvent) {
    e.stopPropagation();
    setEditName(category.name);
    setEditError(null);
    setIsEditing(true);
  }

  function handleEditCancel() {
    setIsEditing(false);
    setEditError(null);
  }

  function handleEditSave() {
    if (!editName.trim()) {
      setEditError("Name is required");
      return;
    }
    startTransition(async () => {
      const result = await updateCategory(category.id, editName.trim());
      if ("error" in result) {
        setEditError((result as { error: string }).error);
      } else {
        setIsEditing(false);
        setEditError(null);
        toast.success("Category updated");
        router.refresh();
      }
    });
  }

  function handleDelete(e: React.MouseEvent) {
    e.stopPropagation();
    startTransition(async () => {
      const result = await deleteCategory(category.id);
      if ("error" in result) {
        // silently ignore ownership errors
      } else if ("affected" in result) {
        setAffectedListings(result.affected);
        setWarningOpen(true);
      } else {
        toast.success("Category deleted");
        onDelete?.();
        router.refresh();
      }
    });
  }

  function handleForceDelete() {
    startForceDeleteTransition(async () => {
      await forceDeleteCategory(category.id);
      setWarningOpen(false);
      toast.success("Category deleted");
      onDelete?.();
      router.refresh();
    });
  }

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        className="border border-border rounded-lg overflow-hidden"
      >
        {/* Header row */}
        <div
          className="flex items-center gap-2 px-4 py-3 bg-secondary/50 cursor-pointer hover:bg-secondary/80 transition-colors group"
          onClick={() => { if (!isEditing) onToggle(); }}
        >
          {/* Drag handle */}
          <button
            type="button"
            className="text-muted-foreground/40 hover:text-muted-foreground shrink-0 cursor-grab active:cursor-grabbing touch-none"
            onClick={(e) => e.stopPropagation()}
            {...attributes}
            {...listeners}
            tabIndex={-1}
          >
            <GripVertical className="h-4 w-4" />
          </button>

          <button
            type="button"
            className="text-muted-foreground shrink-0"
            onClick={(e) => { e.stopPropagation(); if (!isEditing) onToggle(); }}
            tabIndex={-1}
          >
            {isOpen
              ? <ChevronDown className="h-4 w-4" />
              : <ChevronRight className="h-4 w-4" />}
          </button>

          {isEditing ? (
            <div className="flex flex-1 items-center gap-2" onClick={(e) => e.stopPropagation()}>
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Category name"
                className="h-8 text-sm bg-background border-border flex-1 min-w-0"
                disabled={isPending}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleEditSave();
                  if (e.key === "Escape") handleEditCancel();
                }}
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
              {editError && <p className="text-xs text-red-400">{editError}</p>}
            </div>
          ) : (
            <>
              <span className="flex-1 font-medium text-foreground text-sm">{category.name}</span>
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
            </>
          )}
        </div>

        {/* Expanded content */}
        {isOpen && (
          <div className="px-4 py-2 border-t border-border">
            {children}
          </div>
        )}
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
