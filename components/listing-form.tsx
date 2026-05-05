"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Plus, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { listingSchema, ListingFormData } from "@/lib/validations/listing";
import { createListing, updateListing } from "@/lib/actions/marketplace";
import { createOption } from "@/lib/actions/addons";
import { formatPrice } from "@/lib/currency";

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

interface ListingFormProps {
  categories: AddonCategory[];
  options: AddonOption[];
  currency: string;
  initialData?: {
    brand?: string;
    make?: string;
    model?: string;
    variant?: string;
    scale?: "1/18" | "1/24" | "1/43" | "1/64";
    production_count?: number;
    description?: string;
    is_preorder?: boolean;
    base_price?: number; // whole currency units
    addon_option_ids?: string[];
  };
  listingId?: string;
}

export function ListingForm({
  categories,
  options,
  currency,
  initialData,
  listingId,
}: ListingFormProps) {
  const [localOptions, setLocalOptions] = useState<AddonOption[]>(options);
  const [checkedAddonIds, setCheckedAddonIds] = useState<Set<string>>(
    new Set(initialData?.addon_option_ids ?? [])
  );
  const [formError, setFormError] = useState<string | null>(null);
  const [isPreorder, setIsPreorder] = useState(
    initialData?.is_preorder ?? false
  );

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ListingFormData>({
    resolver: zodResolver(listingSchema),
    defaultValues: {
      brand: initialData?.brand ?? "",
      make: initialData?.make ?? "",
      model: initialData?.model ?? "",
      variant: initialData?.variant ?? "",
      scale: initialData?.scale ?? undefined,
      production_count: initialData?.production_count ?? undefined,
      description: initialData?.description ?? "",
      is_preorder: initialData?.is_preorder ?? false,
      base_price: initialData?.base_price ?? 0,
      addon_option_ids: [],
    },
  });

  const basePriceValue = watch("base_price") ?? 0;

  // Running total
  const checkedAddons = localOptions.filter((o) => checkedAddonIds.has(o.id));
  const addonTotal = checkedAddons.reduce((sum, o) => sum + o.price, 0);
  const basePriceCents = isNaN(Number(basePriceValue))
    ? 0
    : Math.round(Number(basePriceValue) * 100);
  const runningTotal = basePriceCents + addonTotal;

  // Inline "create add-on" form state per category
  const [addOptionOpen, setAddOptionOpen] = useState<Record<string, boolean>>(
    {}
  );
  const [addOptionName, setAddOptionName] = useState<Record<string, string>>(
    {}
  );
  const [addOptionPrice, setAddOptionPrice] = useState<Record<string, string>>(
    {}
  );
  const [addOptionError, setAddOptionError] = useState<
    Record<string, string | null>
  >({});
  const [isOptionPending, startOptionTransition] = useTransition();

  function handleAddOptionSubmit(categoryId: string) {
    const name = (addOptionName[categoryId] ?? "").trim();
    const priceStr = addOptionPrice[categoryId] ?? "";
    const priceFloat = parseFloat(priceStr);

    if (!name) {
      setAddOptionError((prev) => ({
        ...prev,
        [categoryId]: "Name is required",
      }));
      return;
    }
    if (isNaN(priceFloat) || priceFloat < 0) {
      setAddOptionError((prev) => ({
        ...prev,
        [categoryId]: "Price must be a non-negative number",
      }));
      return;
    }
    const priceInCents = Math.round(priceFloat * 100);

    startOptionTransition(async () => {
      try {
        const result = await createOption(categoryId, name, priceInCents);
        if (result?.option) {
          const newOpt: AddonOption = {
            id: result.option.id,
            category_id: categoryId,
            name: result.option.name,
            price: result.option.price,
          };
          setLocalOptions((prev) => [...prev, newOpt]);
          setCheckedAddonIds((prev) => new Set([...prev, newOpt.id]));
        }
        setAddOptionName((prev) => ({ ...prev, [categoryId]: "" }));
        setAddOptionPrice((prev) => ({ ...prev, [categoryId]: "" }));
        setAddOptionOpen((prev) => ({ ...prev, [categoryId]: false }));
        setAddOptionError((prev) => ({ ...prev, [categoryId]: null }));
      } catch {
        setAddOptionError((prev) => ({
          ...prev,
          [categoryId]: "Failed to create option",
        }));
      }
    });
  }

  async function onSubmit(data: ListingFormData) {
    setFormError(null);

    const formData = new FormData();
    formData.append("brand", data.brand);
    formData.append("make", data.make);
    formData.append("model", data.model);
    formData.append("variant", data.variant);
    formData.append("scale", data.scale);
    if (data.production_count != null) {
      formData.append("production_count", String(data.production_count));
    }
    if (data.description) {
      formData.append("description", data.description);
    }
    formData.append("is_preorder", String(data.is_preorder));
    formData.append("base_price", String(data.base_price));
    for (const id of checkedAddonIds) {
      formData.append("addon_option_ids", id);
    }

    let result;
    if (listingId) {
      result = await updateListing(listingId, formData);
    } else {
      result = await createListing(formData);
    }

    if (result?.errors) {
      const firstError = Object.values(result.errors).flat()[0];
      setFormError(firstError ?? "An error occurred");
    }
  }

  const optionsByCategory = localOptions.reduce<Record<string, AddonOption[]>>(
    (acc, opt) => {
      if (!acc[opt.category_id]) acc[opt.category_id] = [];
      acc[opt.category_id].push(opt);
      return acc;
    },
    {}
  );

  const inputClass =
    "bg-secondary border-border text-foreground placeholder:text-muted-foreground focus-visible:ring-ring";
  const labelClass = "text-foreground";
  const errorClass = "text-red-400 text-sm mt-1";

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {formError && (
        <p className="text-red-400 text-sm bg-red-900/20 border border-red-800 rounded-lg p-3">
          {formError}
        </p>
      )}

      {/* Identity Section */}
      <div className="bg-card border border-border rounded-xl p-6 space-y-4">
        <h2 className="text-foreground font-semibold text-lg">Identity</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label htmlFor="brand" className={labelClass}>
              Brand *
            </Label>
            <Input
              id="brand"
              {...register("brand")}
              className={inputClass}
              placeholder="e.g. Hot Wheels"
            />
            {errors.brand && (
              <p className={errorClass}>{errors.brand.message}</p>
            )}
          </div>

          <div className="space-y-1">
            <Label htmlFor="make" className={labelClass}>
              Make *
            </Label>
            <Input
              id="make"
              {...register("make")}
              className={inputClass}
              placeholder="e.g. Ferrari"
            />
            {errors.make && <p className={errorClass}>{errors.make.message}</p>}
          </div>

          <div className="space-y-1">
            <Label htmlFor="model" className={labelClass}>
              Model *
            </Label>
            <Input
              id="model"
              {...register("model")}
              className={inputClass}
              placeholder="e.g. 250 GTO"
            />
            {errors.model && (
              <p className={errorClass}>{errors.model.message}</p>
            )}
          </div>

          <div className="space-y-1">
            <Label htmlFor="variant" className={labelClass}>
              Variant *
            </Label>
            <Input
              id="variant"
              {...register("variant")}
              className={inputClass}
              placeholder="e.g. Red, 1962"
            />
            {errors.variant && (
              <p className={errorClass}>{errors.variant.message}</p>
            )}
          </div>

          <div className="space-y-1">
            <Label htmlFor="scale" className={labelClass}>
              Scale *
            </Label>
            <Select
              defaultValue={initialData?.scale}
              onValueChange={(v) =>
                setValue("scale", v as ListingFormData["scale"], {
                  shouldValidate: true,
                })
              }
            >
              <SelectTrigger id="scale" className={inputClass}>
                <SelectValue placeholder="Select scale" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                {(["1/18", "1/24", "1/43", "1/64"] as const).map((s) => (
                  <SelectItem
                    key={s}
                    value={s}
                    className="text-foreground focus:bg-secondary"
                  >
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.scale && (
              <p className={errorClass}>{errors.scale.message}</p>
            )}
          </div>
        </div>
      </div>

      {/* Details Section */}
      <div className="bg-card border border-border rounded-xl p-6 space-y-4">
        <h2 className="text-foreground font-semibold text-lg">Details</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label htmlFor="production_count" className={labelClass}>
              Production Count
            </Label>
            <Input
              id="production_count"
              type="number"
              min={1}
              {...register("production_count", { valueAsNumber: true })}
              className={inputClass}
              placeholder="Optional"
            />
            {errors.production_count && (
              <p className={errorClass}>{errors.production_count.message}</p>
            )}
          </div>

          <div className="space-y-1">
            <Label htmlFor="base_price" className={labelClass}>
              Base Price *
            </Label>
            <Input
              id="base_price"
              type="number"
              min={0}
              step={1}
              {...register("base_price", { valueAsNumber: true })}
              className={inputClass}
              placeholder="e.g. 42"
            />
            {errors.base_price && (
              <p className={errorClass}>{errors.base_price.message}</p>
            )}
          </div>
        </div>

        <div className="space-y-1">
          <Label htmlFor="description" className={labelClass}>
            Description
          </Label>
          <Textarea
            id="description"
            {...register("description")}
            className={`${inputClass} min-h-[100px]`}
            placeholder="Optional notes about this custom"
          />
          {errors.description && (
            <p className={errorClass}>{errors.description.message}</p>
          )}
        </div>

        <div className="flex items-center gap-3 pt-1">
          <Checkbox
            id="is_preorder"
            checked={isPreorder}
            onCheckedChange={(checked) => {
              const val = checked === true;
              setIsPreorder(val);
              setValue("is_preorder", val, { shouldValidate: true });
            }}
            className="border-border data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
          />
          <Label htmlFor="is_preorder" className={labelClass}>
            Is Pre-order
          </Label>
        </div>
      </div>

      {/* Add-ons Section */}
      <div className="bg-card border border-border rounded-xl p-6 space-y-4">
        <h2 className="text-foreground font-semibold text-lg">
          Add-ons included
        </h2>

        {categories.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">
            No add-on categories configured. Create some in the Marketplace
            settings.
          </p>
        )}

        {categories.map((category) => {
          const categoryOptions = optionsByCategory[category.id] ?? [];
          const optFormOpen = addOptionOpen[category.id] ?? false;
          const optError = addOptionError[category.id] ?? null;

          return (
            <div key={category.id} className="space-y-2">
              <p className="text-sm font-medium text-foreground">
                {category.name}
              </p>

              {categoryOptions.length === 0 && !optFormOpen && (
                <p className="text-xs text-muted-foreground pl-1">
                  No options yet.
                </p>
              )}

              {categoryOptions.map((opt) => {
                const checked = checkedAddonIds.has(opt.id);
                return (
                  <div
                    key={opt.id}
                    className="flex items-center gap-3 pl-1"
                  >
                    <Checkbox
                      id={`addon-${opt.id}`}
                      checked={checked}
                      onCheckedChange={(val) => {
                        setCheckedAddonIds((prev) => {
                          const next = new Set(prev);
                          if (val === true) {
                            next.add(opt.id);
                          } else {
                            next.delete(opt.id);
                          }
                          return next;
                        });
                      }}
                      className="border-border data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                    />
                    <Label
                      htmlFor={`addon-${opt.id}`}
                      className="flex-1 text-foreground cursor-pointer"
                    >
                      {opt.name}
                    </Label>
                    <span className="text-sm text-muted-foreground shrink-0">
                      {formatPrice(opt.price, currency)}
                    </span>
                  </div>
                );
              })}

              {/* Inline add-option form */}
              {optFormOpen ? (
                <div className="mt-1 space-y-1.5 pl-1">
                  <div className="flex items-center gap-2">
                    <Input
                      value={addOptionName[category.id] ?? ""}
                      onChange={(e) =>
                        setAddOptionName((prev) => ({
                          ...prev,
                          [category.id]: e.target.value,
                        }))
                      }
                      placeholder="Option name"
                      className="h-8 text-sm bg-secondary border-border flex-1 min-w-0"
                      disabled={isOptionPending}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddOptionSubmit(category.id);
                        }
                        if (e.key === "Escape")
                          setAddOptionOpen((prev) => ({
                            ...prev,
                            [category.id]: false,
                          }));
                      }}
                    />
                    <Input
                      type="number"
                      value={addOptionPrice[category.id] ?? ""}
                      onChange={(e) =>
                        setAddOptionPrice((prev) => ({
                          ...prev,
                          [category.id]: e.target.value,
                        }))
                      }
                      placeholder="Price"
                      min="0"
                      step="0.01"
                      className="h-8 text-sm bg-secondary border-border w-24"
                      disabled={isOptionPending}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-green-400 hover:text-green-300 hover:bg-green-900/20 shrink-0"
                      onClick={() => handleAddOptionSubmit(category.id)}
                      disabled={isOptionPending}
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-foreground shrink-0"
                      onClick={() =>
                        setAddOptionOpen((prev) => ({
                          ...prev,
                          [category.id]: false,
                        }))
                      }
                      disabled={isOptionPending}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  {optError && (
                    <p className="text-xs text-red-400">{optError}</p>
                  )}
                </div>
              ) : (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs text-muted-foreground hover:text-foreground gap-1 px-2 pl-1"
                  onClick={() =>
                    setAddOptionOpen((prev) => ({
                      ...prev,
                      [category.id]: true,
                    }))
                  }
                >
                  <Plus className="h-3 w-3" />
                  Add option
                </Button>
              )}
            </div>
          );
        })}
      </div>

      {/* Running total */}
      <div className="bg-card border border-border rounded-xl p-4 sm:p-6">
        <div className="flex items-center justify-between">
          <span className="text-foreground font-semibold">Total</span>
          <span className="text-foreground font-bold text-lg">
            {formatPrice(runningTotal, currency)}
          </span>
        </div>
      </div>

      <Button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Saving...
          </>
        ) : listingId ? (
          "Save Changes"
        ) : (
          "Create Listing"
        )}
      </Button>
    </form>
  );
}
