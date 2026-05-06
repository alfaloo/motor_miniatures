"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createCategory, createOption } from "@/lib/actions/addons";
import { AddonCategoryRow } from "@/components/addon-category-row";
import { AddonOptionRow } from "@/components/addon-option-row";

interface AddonCategory {
  id: string;
  name: string;
}

interface AddonOption {
  id: string;
  category_id: string;
  name: string;
  price: number; // cents
}

interface AddonConfigPanelProps {
  categories: AddonCategory[];
  options: AddonOption[];
}

export function AddonConfigPanel({ categories, options }: AddonConfigPanelProps) {
  const router = useRouter();

  // Accordion state: set of open category IDs
  const [openCategories, setOpenCategories] = useState<Set<string>>(
    new Set(categories.map((c) => c.id))
  );

  function toggleCategory(id: string) {
    setOpenCategories((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  // Add category form state
  const [addCategoryOpen, setAddCategoryOpen] = useState(false);
  const [addCategoryName, setAddCategoryName] = useState("");
  const [addCategoryError, setAddCategoryError] = useState<string | null>(null);
  const [isCategoryPending, startCategoryTransition] = useTransition();

  function handleAddCategorySubmit() {
    if (!addCategoryName.trim()) {
      setAddCategoryError("Name is required");
      return;
    }
    startCategoryTransition(async () => {
      try {
        await createCategory(addCategoryName.trim());
        setAddCategoryName("");
        setAddCategoryOpen(false);
        setAddCategoryError(null);
        toast.success("Category created");
        router.refresh();
      } catch {
        setAddCategoryError("Failed to create category");
      }
    });
  }

  // Add option form state (per category)
  const [addOptionOpen, setAddOptionOpen] = useState<Record<string, boolean>>({});
  const [addOptionName, setAddOptionName] = useState<Record<string, string>>({});
  const [addOptionPrice, setAddOptionPrice] = useState<Record<string, string>>({});
  const [addOptionError, setAddOptionError] = useState<Record<string, string | null>>({});
  const [isOptionPending, startOptionTransition] = useTransition();

  function handleAddOptionSubmit(categoryId: string) {
    const name = (addOptionName[categoryId] ?? "").trim();
    const priceStr = addOptionPrice[categoryId] ?? "";
    const priceFloat = parseFloat(priceStr);

    if (!name) {
      setAddOptionError((prev) => ({ ...prev, [categoryId]: "Name is required" }));
      return;
    }
    if (isNaN(priceFloat) || priceFloat < 0) {
      setAddOptionError((prev) => ({ ...prev, [categoryId]: "Price must be a non-negative number" }));
      return;
    }
    const priceInCents = Math.round(priceFloat * 100);

    startOptionTransition(async () => {
      try {
        await createOption(categoryId, name, priceInCents);
        setAddOptionName((prev) => ({ ...prev, [categoryId]: "" }));
        setAddOptionPrice((prev) => ({ ...prev, [categoryId]: "" }));
        setAddOptionOpen((prev) => ({ ...prev, [categoryId]: false }));
        setAddOptionError((prev) => ({ ...prev, [categoryId]: null }));
        toast.success("Option created");
        router.refresh();
      } catch {
        setAddOptionError((prev) => ({ ...prev, [categoryId]: "Failed to create option" }));
      }
    });
  }

  const optionsByCategory = options.reduce<Record<string, AddonOption[]>>((acc, opt) => {
    if (!acc[opt.category_id]) acc[opt.category_id] = [];
    acc[opt.category_id].push(opt);
    return acc;
  }, {});

  return (
    <div className="space-y-2">
      {categories.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-4">
          No categories yet. Add one below.
        </p>
      )}

      {categories.map((category) => {
        const categoryOptions = optionsByCategory[category.id] ?? [];
        const isOpen = openCategories.has(category.id);
        const optFormOpen = addOptionOpen[category.id] ?? false;
        const optError = addOptionError[category.id] ?? null;

        return (
          <AddonCategoryRow
            key={category.id}
            category={category}
            isOpen={isOpen}
            onToggle={() => toggleCategory(category.id)}
          >
            {/* Options list */}
            {categoryOptions.length === 0 && (
              <p className="text-xs text-muted-foreground py-1">No options yet.</p>
            )}
            {categoryOptions.map((opt) => (
              <AddonOptionRow key={opt.id} option={opt} />
            ))}

            {/* Add option inline form */}
            {optFormOpen ? (
              <div className="mt-2 space-y-1.5">
                <div className="flex items-center gap-2">
                  <Input
                    value={addOptionName[category.id] ?? ""}
                    onChange={(e) =>
                      setAddOptionName((prev) => ({ ...prev, [category.id]: e.target.value }))
                    }
                    placeholder="Option name"
                    className="h-8 text-sm bg-secondary border-border flex-1 min-w-0"
                    disabled={isOptionPending}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleAddOptionSubmit(category.id);
                      if (e.key === "Escape") setAddOptionOpen((prev) => ({ ...prev, [category.id]: false }));
                    }}
                  />
                  <Input
                    type="number"
                    value={addOptionPrice[category.id] ?? ""}
                    onChange={(e) =>
                      setAddOptionPrice((prev) => ({ ...prev, [category.id]: e.target.value }))
                    }
                    placeholder="Price"
                    min="0"
                    step="0.01"
                    className="h-8 text-sm bg-secondary border-border w-24"
                    disabled={isOptionPending}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-green-400 hover:text-green-300 hover:bg-green-900/20 shrink-0"
                    onClick={() => handleAddOptionSubmit(category.id)}
                    disabled={isOptionPending}
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-foreground shrink-0"
                    onClick={() =>
                      setAddOptionOpen((prev) => ({ ...prev, [category.id]: false }))
                    }
                    disabled={isOptionPending}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                {optError && <p className="text-xs text-red-400">{optError}</p>}
              </div>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                className="mt-1 h-7 text-xs text-muted-foreground hover:text-foreground gap-1 px-2"
                onClick={() => {
                  setAddOptionOpen((prev) => ({ ...prev, [category.id]: true }));
                  // Ensure category is open when adding option
                  setOpenCategories((prev) => new Set([...prev, category.id]));
                }}
              >
                <Plus className="h-3 w-3" />
                Add option
              </Button>
            )}
          </AddonCategoryRow>
        );
      })}

      {/* Add category form */}
      <div className="pt-2">
        {addCategoryOpen ? (
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <Input
                value={addCategoryName}
                onChange={(e) => setAddCategoryName(e.target.value)}
                placeholder="Category name"
                className="h-8 text-sm bg-secondary border-border flex-1 min-w-0"
                disabled={isCategoryPending}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleAddCategorySubmit();
                  if (e.key === "Escape") setAddCategoryOpen(false);
                }}
              />
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-green-400 hover:text-green-300 hover:bg-green-900/20 shrink-0"
                onClick={handleAddCategorySubmit}
                disabled={isCategoryPending}
              >
                <Check className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-foreground shrink-0"
                onClick={() => {
                  setAddCategoryOpen(false);
                  setAddCategoryError(null);
                }}
                disabled={isCategoryPending}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            {addCategoryError && (
              <p className="text-xs text-red-400">{addCategoryError}</p>
            )}
          </div>
        ) : (
          <Button
            variant="outline"
            size="sm"
            className="w-full border-dashed border-border text-muted-foreground hover:text-foreground gap-1.5"
            onClick={() => setAddCategoryOpen(true)}
          >
            <Plus className="h-4 w-4" />
            Add category
          </Button>
        )}
      </div>
    </div>
  );
}
