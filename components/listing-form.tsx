"use client";

import { useState, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Plus, Check, X, Trash2 } from "lucide-react";
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
import { listingSchema, ListingFormData, salesRecordSchema } from "@/lib/validations/listing";
import { createListing, updateListing, updateListingImageUrl, updateListingPrivateInfo } from "@/lib/actions/marketplace";
import { createOption } from "@/lib/actions/addons";
import { formatPrice } from "@/lib/currency";
import type { SalesRecord } from "@/db/schema";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function sortSalesRecords(records: SalesRecord[]): SalesRecord[] {
  return [...records].sort((a, b) => {
    if (b.sale_year !== a.sale_year) return b.sale_year - a.sale_year;
    return b.sale_month - a.sale_month;
  });
}

interface AddonCategory {
  id: string;
  name: string;
}

interface AddonOption {
  id: string;
  category_id: string;
  name: string;
  price: number;
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
    is_made_to_order?: boolean;
    preorder_wait_days?: number | null;
    addon_option_ids?: string[];
    addon_option_quantities?: Record<string, number>;
  };
  listingId?: string;
  displayImageUrl?: string | null;
  privateComments?: string | null;
  initialSalesRecords?: SalesRecord[];
  collectingSinceYear?: number;
  totalPrice?: number;
}

export function ListingForm({
  categories,
  options,
  currency,
  initialData,
  listingId,
  displayImageUrl,
  privateComments: initialPrivateComments,
  initialSalesRecords,
  collectingSinceYear,
  totalPrice,
}: ListingFormProps) {
  const router = useRouter();
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  const [localOptions, setLocalOptions] = useState<AddonOption[]>(options);
  const [checkedAddonIds, setCheckedAddonIds] = useState<Set<string>>(
    new Set(initialData?.addon_option_ids ?? [])
  );
  const [addonQuantities, setAddonQuantities] = useState<Record<string, number>>(
    initialData?.addon_option_quantities ?? {}
  );
  const [formError, setFormError] = useState<string | null>(null);
  const [isMadeToOrder, setIsPreorder] = useState(
    initialData?.is_made_to_order ?? false
  );
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(
    displayImageUrl ?? null
  );
  const [imageError, setImageError] = useState<string | null>(null);
  const [removeImage, setRemoveImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Private Info state
  const [privateComments, setPrivateComments] = useState(initialPrivateComments ?? "");
  const [salesRecords, setSalesRecords] = useState<SalesRecord[]>(initialSalesRecords ?? []);
  const [isSalePending, startSaleTransition] = useTransition();
  const [addSaleOpen, setAddSaleOpen] = useState(false);
  const [addSaleYear, setAddSaleYear] = useState(String(currentYear));
  const [addSaleMonth, setAddSaleMonth] = useState(String(currentMonth));
  const [addSalePrice, setAddSalePrice] = useState("");
  const [addSaleError, setAddSaleError] = useState<string | null>(null);
  const saleYearInputRef = useRef<HTMLInputElement>(null);

  function openSaleForm() {
    setAddSaleYear(String(currentYear));
    setAddSaleMonth(String(currentMonth));
    setAddSalePrice(listingId && totalPrice != null ? String(totalPrice) : "");
    setAddSaleError(null);
    setAddSaleOpen(true);
    setTimeout(() => saleYearInputRef.current?.focus(), 0);
  }

  function closeSaleForm() {
    setAddSaleOpen(false);
    setAddSaleError(null);
  }

  function handleSaleSubmit() {
    if (!listingId && (!addSalePrice || addSalePrice.trim() === "")) {
      setAddSaleError("Sale price is required");
      return;
    }

    const year = parseInt(addSaleYear, 10);
    const month = parseInt(addSaleMonth, 10);
    const price = parseInt(addSalePrice, 10);

    const validation = salesRecordSchema.safeParse({
      id: "00000000-0000-0000-0000-000000000000",
      sale_year: year,
      sale_month: month,
      sale_price: price,
    });

    if (!validation.success) {
      setAddSaleError(validation.error.errors[0]?.message ?? "Invalid input");
      return;
    }

    const newRecord: SalesRecord = {
      id: crypto.randomUUID(),
      sale_year: year,
      sale_month: month,
      sale_price: price,
    };

    if (listingId) {
      const optimistic = [newRecord, ...salesRecords];
      setSalesRecords(optimistic);
      startSaleTransition(async () => {
        const result = await updateListingPrivateInfo(
          listingId,
          privateComments.trim() || null,
          optimistic
        );
        if (result.success) {
          setAddSaleOpen(false);
          setAddSaleError(null);
        } else {
          setSalesRecords(salesRecords);
          setAddSaleError(result.error ?? "Failed to save record");
        }
      });
    } else {
      setSalesRecords([newRecord, ...salesRecords]);
      setAddSaleOpen(false);
      setAddSaleError(null);
    }
  }

  function handleSaleDelete(id: string) {
    const prevRecords = salesRecords;
    const updated = salesRecords.filter((r) => r.id !== id);
    setSalesRecords(updated);

    if (listingId) {
      startSaleTransition(async () => {
        const result = await updateListingPrivateInfo(
          listingId,
          privateComments.trim() || null,
          updated
        );
        if (!result.success) {
          setSalesRecords(prevRecords);
        }
      });
    }
  }

  const {
    register,
    handleSubmit,
    setValue,
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
      is_made_to_order: initialData?.is_made_to_order ?? false,
      preorder_wait_days: initialData?.preorder_wait_days ?? null,
      addon_option_ids: [],
    },
  });

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    const maxSize = 5 * 1024 * 1024;

    if (!allowedTypes.includes(file.type)) {
      setImageError("Only JPG, PNG, and WebP images are allowed.");
      setImageFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }
    if (file.size > maxSize) {
      setImageError("Image must be 5 MB or smaller.");
      setImageFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setImageError(null);
    setImageFile(file);
    setImagePreviewUrl(URL.createObjectURL(file));
    setRemoveImage(false);
  }

  // Running total
  const checkedAddons = localOptions.filter((o) => checkedAddonIds.has(o.id));
  const runningTotal = checkedAddons.reduce(
    (sum, o) => sum + o.price * (addonQuantities[o.id] ?? 1),
    0
  );

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
    const price = parseInt(priceStr, 10);

    if (!name) {
      setAddOptionError((prev) => ({
        ...prev,
        [categoryId]: "Name is required",
      }));
      return;
    }
    if (isNaN(price) || price < 0) {
      setAddOptionError((prev) => ({
        ...prev,
        [categoryId]: "Price must be a non-negative integer",
      }));
      return;
    }

    startOptionTransition(async () => {
      try {
        const result = await createOption(categoryId, name, price);
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
    formData.append("is_made_to_order", String(data.is_made_to_order));
    if (data.is_made_to_order && data.preorder_wait_days != null) {
      formData.append("preorder_wait_days", String(data.preorder_wait_days));
    }
    for (const id of checkedAddonIds) {
      formData.append("addon_option_ids", id);
      formData.append("addon_option_quantities", String(addonQuantities[id] ?? 1));
    }

    formData.append("privateComments", privateComments ?? "");
    formData.append("salesRecords", JSON.stringify(salesRecords));

    if (listingId) {
      // Update flow
      if (removeImage) {
        formData.append("remove_image", "true");
      } else if (imageFile) {
        const uploadData = new FormData();
        uploadData.append("listingId", listingId);
        uploadData.append("file", imageFile);
        const uploadRes = await fetch("/api/listings/upload-image", {
          method: "POST",
          body: uploadData,
        });
        if (!uploadRes.ok) {
          const { error } = await uploadRes.json().catch(() => ({ error: "Upload failed" }));
          setFormError(error ?? "Image upload failed");
          return;
        }
        const { url } = await uploadRes.json();
        formData.append("display_image_url", url);
      }
      const result = await updateListing(listingId, formData);
      if (result?.errors) {
        const firstError = Object.values(result.errors).flat()[0];
        setFormError(firstError ?? "An error occurred");
      }
    } else {
      // Create flow
      const createResult = await createListing(formData);
      if (createResult?.errors) {
        const firstError = Object.values(createResult.errors).flat()[0];
        setFormError(firstError ?? "An error occurred");
        return;
      }
      const newId = createResult?.id;
      if (!newId) {
        setFormError("Failed to create listing");
        return;
      }

      // Upload image only if one was selected
      if (imageFile) {
        const uploadData = new FormData();
        uploadData.append("listingId", newId);
        uploadData.append("file", imageFile);
        const uploadRes = await fetch("/api/listings/upload-image", {
          method: "POST",
          body: uploadData,
        });
        if (!uploadRes.ok) {
          const { error } = await uploadRes.json().catch(() => ({ error: "Upload failed" }));
          setFormError(error ?? "Image upload failed");
          return;
        }
        const { url } = await uploadRes.json();
        await updateListingImageUrl(newId, url);
      }

      router.push("/marketplace?toast=listing_created");
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
            placeholder="Leave blank for made to order"
          />
          {errors.production_count && (
            <p className={errorClass}>{errors.production_count.message}</p>
          )}
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

        <div className="space-y-3">
          <div className="flex items-center gap-3 pt-1">
            <Checkbox
              id="is_made_to_order"
              checked={isMadeToOrder}
              onCheckedChange={(checked) => {
                const val = checked === true;
                setIsPreorder(val);
                setValue("is_made_to_order", val, { shouldValidate: true });
                if (!val) {
                  setValue("preorder_wait_days", null);
                }
              }}
              className="border-border data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
            />
            <Label htmlFor="is_made_to_order" className={labelClass}>
              Is Made to Order
            </Label>
          </div>

          {isMadeToOrder && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pl-4 border-l-2 border-blue-600/40">
              <div className="space-y-1">
                <Label htmlFor="preorder_wait_days" className={labelClass}>
                  Expected Wait (days) *
                </Label>
                <Input
                  id="preorder_wait_days"
                  type="number"
                  min={1}
                  {...register("preorder_wait_days", { valueAsNumber: true })}
                  className={inputClass}
                  placeholder="e.g. 14"
                />
                {errors.preorder_wait_days && (
                  <p className={errorClass}>{errors.preorder_wait_days.message}</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Images Section */}
      <div className="bg-card border border-border rounded-xl p-6 space-y-4">
        <h2 className="text-foreground font-semibold text-lg">Images</h2>

        <div className="space-y-2">
          <Label htmlFor="display_image" className={labelClass}>
            Display Image
          </Label>

          <input
            ref={fileInputRef}
            id="display_image"
            type="file"
            accept=".jpg,.jpeg,.png,.webp"
            onChange={handleFileChange}
            className={`w-full rounded-md border border-border px-3 py-2 text-sm ${inputClass} file:mr-4 file:py-1 file:px-3 file:rounded file:border-0 file:text-sm file:bg-secondary file:text-foreground hover:file:bg-accent cursor-pointer`}
          />

          {imageError && <p className={errorClass}>{imageError}</p>}

          <img
            src={removeImage ? "/listing-placeholder.svg" : (imagePreviewUrl ?? "/listing-placeholder.svg")}
            alt="Display image preview"
            className="h-32 w-32 object-cover rounded-md mt-2"
          />

          {imageFile && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 text-xs text-red-400 hover:text-red-300 hover:bg-red-900/20 gap-1 px-2 pl-1"
              onClick={() => {
                setImageFile(null);
                setImagePreviewUrl(displayImageUrl ?? null);
                if (fileInputRef.current) fileInputRef.current.value = "";
              }}
            >
              <X className="h-3 w-3" />
              Clear selection
            </Button>
          )}

          {listingId && displayImageUrl && !imageFile && !removeImage && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 text-xs text-red-400 hover:text-red-300 hover:bg-red-900/20 gap-1 px-2 pl-1"
              onClick={() => setRemoveImage(true)}
            >
              <X className="h-3 w-3" />
              Remove image
            </Button>
          )}

          {removeImage && !imageFile && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 text-xs text-muted-foreground hover:text-foreground gap-1 px-2 pl-1"
              onClick={() => {
                setRemoveImage(false);
                setImagePreviewUrl(displayImageUrl ?? null);
              }}
            >
              Undo remove
            </Button>
          )}
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
                const qty = addonQuantities[opt.id] ?? 1;
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
                            setAddonQuantities((q) => ({ ...q, [opt.id]: q[opt.id] ?? 1 }));
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
                    {checked && (
                      <Input
                        type="number"
                        value={qty}
                        onChange={(e) => {
                          const val = parseInt(e.target.value, 10);
                          if (!isNaN(val) && val >= 1) {
                            setAddonQuantities((q) => ({ ...q, [opt.id]: val }));
                          }
                        }}
                        min="1"
                        step="1"
                        className="h-7 text-sm bg-secondary border-border w-16 shrink-0"
                        onClick={(e) => e.preventDefault()}
                      />
                    )}
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
                      step="1"
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

      {/* Private Info Section */}
      <div className="bg-card border border-border rounded-xl p-6 space-y-4">
        <h2 className="text-foreground font-semibold text-lg">Private Info</h2>

        {/* Comments */}
        <div className="space-y-1.5">
          <Label htmlFor="privateComments" className="text-foreground">
            Comments
          </Label>
          <textarea
            id="privateComments"
            value={privateComments}
            onChange={(e) => setPrivateComments(e.target.value)}
            placeholder="Internal notes…"
            rows={3}
            className="w-full resize-none rounded-md border border-border bg-secondary px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>

        {/* Sales Records */}
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Sales Records
          </p>

          <div className="space-y-0.5">
            {sortSalesRecords(salesRecords).map((record) => (
              <div key={record.id} className="flex items-center gap-2 py-1 group">
                <span className="flex-1 text-sm text-foreground">
                  {MONTH_NAMES[record.sale_month - 1]?.slice(0, 3)} {record.sale_year}
                </span>
                <span className="text-sm text-muted-foreground tabular-nums">
                  ${record.sale_price.toLocaleString()}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-red-400/70 hover:text-red-400 hover:bg-red-900/20 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                  onClick={() => handleSaleDelete(record.id)}
                  disabled={isSalePending}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
          </div>

          {addSaleOpen ? (
            <div className="mt-2 space-y-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                <Input
                  ref={saleYearInputRef}
                  type="number"
                  value={addSaleYear}
                  onChange={(e) => setAddSaleYear(e.target.value)}
                  placeholder="Year"
                  min={collectingSinceYear ?? 1900}
                  max={currentYear + 1}
                  step="1"
                  className="h-8 text-sm bg-secondary border-border w-20"
                  disabled={isSalePending}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") { e.preventDefault(); handleSaleSubmit(); }
                    if (e.key === "Escape") closeSaleForm();
                  }}
                />
                <select
                  value={addSaleMonth}
                  onChange={(e) => setAddSaleMonth(e.target.value)}
                  disabled={isSalePending}
                  className="h-8 rounded-md border border-border bg-secondary px-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-50 w-32"
                >
                  {MONTH_NAMES.map((name, i) => (
                    <option key={i + 1} value={String(i + 1)}>
                      {name}
                    </option>
                  ))}
                </select>
                <Input
                  type="number"
                  value={addSalePrice}
                  onChange={(e) => setAddSalePrice(e.target.value)}
                  placeholder="Price"
                  min="0"
                  step="1"
                  className="h-8 text-sm bg-secondary border-border w-24"
                  disabled={isSalePending}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") { e.preventDefault(); handleSaleSubmit(); }
                    if (e.key === "Escape") closeSaleForm();
                  }}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-green-400 hover:text-green-300 hover:bg-green-900/20 shrink-0"
                  onClick={handleSaleSubmit}
                  disabled={isSalePending}
                >
                  <Check className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-foreground shrink-0"
                  onClick={closeSaleForm}
                  disabled={isSalePending}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              {addSaleError && <p className="text-xs text-red-400">{addSaleError}</p>}
            </div>
          ) : (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="mt-1 h-7 text-xs text-muted-foreground hover:text-foreground gap-1 px-2 pl-1"
              onClick={openSaleForm}
            >
              <Plus className="h-3 w-3" />
              Add sale record
            </Button>
          )}
        </div>
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
