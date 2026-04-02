"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { itemSchema, ItemFormData } from "@/lib/validations/item";
import { createItem, updateItem } from "@/lib/actions/items";
import { toast } from "sonner";

const MONTHS = [
  { value: 1, label: "January" },
  { value: 2, label: "February" },
  { value: 3, label: "March" },
  { value: 4, label: "April" },
  { value: 5, label: "May" },
  { value: 6, label: "June" },
  { value: 7, label: "July" },
  { value: 8, label: "August" },
  { value: 9, label: "September" },
  { value: 10, label: "October" },
  { value: 11, label: "November" },
  { value: 12, label: "December" },
];

interface ItemFormProps {
  collectingSinceYear: number;
  initialData?: Partial<ItemFormData>;
  itemId?: string;
}

function getYearOptions(collectingSinceYear: number): number[] {
  const currentYear = new Date().getFullYear();
  const years: number[] = [];
  for (let y = currentYear; y >= collectingSinceYear; y--) {
    years.push(y);
  }
  return years;
}

export function ItemForm({ collectingSinceYear, initialData, itemId }: ItemFormProps) {
  const [isPreorder, setIsPreorder] = useState(initialData?.is_preorder ?? false);
  const [isSold, setIsSold] = useState(initialData?.is_sold ?? false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ItemFormData>({
    resolver: zodResolver(itemSchema),
    defaultValues: {
      brand: initialData?.brand ?? "",
      make: initialData?.make ?? "",
      model: initialData?.model ?? "",
      variant: initialData?.variant ?? "",
      scale: initialData?.scale ?? undefined,
      serial_number: initialData?.serial_number ?? undefined,
      production_count: initialData?.production_count ?? undefined,
      grade: initialData?.grade ?? undefined,
      purchase_price: initialData?.purchase_price ?? undefined,
      purchase_platform: initialData?.purchase_platform ?? "",
      purchase_year: initialData?.purchase_year ?? undefined,
      purchase_month: initialData?.purchase_month ?? undefined,
      is_preorder: initialData?.is_preorder ?? false,
      received_year: initialData?.received_year ?? undefined,
      received_month: initialData?.received_month ?? undefined,
      is_sold: initialData?.is_sold ?? false,
      sold_price: initialData?.sold_price ?? undefined,
      sold_platform: initialData?.sold_platform ?? "",
      sold_year: initialData?.sold_year ?? undefined,
      sold_month: initialData?.sold_month ?? undefined,
    },
  });

  const yearOptions = getYearOptions(collectingSinceYear);

  const [formError, setFormError] = useState<string | null>(null);

  async function onSubmit(data: ItemFormData) {
    setFormError(null);
    let result;
    if (itemId) {
      result = await updateItem(itemId, data);
    } else {
      result = await createItem(data);
    }
    if (result?.error) {
      setFormError(result.error);
      toast.error(result.error);
    }
  }

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
            <Label htmlFor="brand" className={labelClass}>Brand *</Label>
            <Input id="brand" {...register("brand")} className={inputClass} placeholder="e.g. Hot Wheels" />
            {errors.brand && <p className={errorClass}>{errors.brand.message}</p>}
          </div>

          <div className="space-y-1">
            <Label htmlFor="make" className={labelClass}>Make *</Label>
            <Input id="make" {...register("make")} className={inputClass} placeholder="e.g. Ferrari" />
            {errors.make && <p className={errorClass}>{errors.make.message}</p>}
          </div>

          <div className="space-y-1">
            <Label htmlFor="model" className={labelClass}>Model *</Label>
            <Input id="model" {...register("model")} className={inputClass} placeholder="e.g. 250 GTO" />
            {errors.model && <p className={errorClass}>{errors.model.message}</p>}
          </div>

          <div className="space-y-1">
            <Label htmlFor="variant" className={labelClass}>Variant *</Label>
            <Input id="variant" {...register("variant")} className={inputClass} placeholder="e.g. Red, 1962" />
            {errors.variant && <p className={errorClass}>{errors.variant.message}</p>}
          </div>

          <div className="space-y-1">
            <Label htmlFor="scale" className={labelClass}>Scale *</Label>
            <Select
              defaultValue={initialData?.scale}
              onValueChange={(v) => setValue("scale", v as ItemFormData["scale"], { shouldValidate: true })}
            >
              <SelectTrigger id="scale" className={inputClass}>
                <SelectValue placeholder="Select scale" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                {["1/18", "1/24", "1/43", "1/64"].map((s) => (
                  <SelectItem key={s} value={s} className="text-foreground focus:bg-secondary">
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.scale && <p className={errorClass}>{errors.scale.message}</p>}
          </div>
        </div>
      </div>

      {/* Details Section */}
      <div className="bg-card border border-border rounded-xl p-6 space-y-4">
        <h2 className="text-foreground font-semibold text-lg">Details</h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-1">
            <Label htmlFor="serial_number" className={labelClass}>Serial Number</Label>
            <Input
              id="serial_number"
              type="number"
              min={1}
              {...register("serial_number", { valueAsNumber: true })}
              className={inputClass}
              placeholder="Optional"
            />
            {errors.serial_number && <p className={errorClass}>{errors.serial_number.message}</p>}
          </div>

          <div className="space-y-1">
            <Label htmlFor="production_count" className={labelClass}>Production Count</Label>
            <Input
              id="production_count"
              type="number"
              min={1}
              {...register("production_count", { valueAsNumber: true })}
              className={inputClass}
              placeholder="Optional"
            />
            {errors.production_count && <p className={errorClass}>{errors.production_count.message}</p>}
          </div>

          <div className="space-y-1">
            <Label htmlFor="grade" className={labelClass}>Grade</Label>
            <Select
              defaultValue={initialData?.grade != null ? String(initialData.grade) : "ungraded"}
              onValueChange={(v) =>
                setValue("grade", v === "ungraded" ? null : parseInt(v, 10), { shouldValidate: true })
              }
            >
              <SelectTrigger id="grade" className={inputClass}>
                <SelectValue placeholder="Select grade" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                <SelectItem value="ungraded" className="text-foreground focus:bg-secondary">
                  Ungraded
                </SelectItem>
                {Array.from({ length: 10 }, (_, i) => i + 1).map((g) => (
                  <SelectItem key={g} value={String(g)} className="text-foreground focus:bg-secondary">
                    {g}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.grade && <p className={errorClass}>{errors.grade.message}</p>}
          </div>
        </div>
      </div>

      {/* Purchase Section */}
      <div className="bg-card border border-border rounded-xl p-6 space-y-4">
        <h2 className="text-foreground font-semibold text-lg">Purchase</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label htmlFor="purchase_price" className={labelClass}>Purchase Price (dollars) *</Label>
            <Input
              id="purchase_price"
              type="number"
              min={1}
              {...register("purchase_price", { valueAsNumber: true })}
              className={inputClass}
              placeholder="e.g. 25"
            />
            {errors.purchase_price && <p className={errorClass}>{errors.purchase_price.message}</p>}
          </div>

          <div className="space-y-1">
            <Label htmlFor="purchase_platform" className={labelClass}>Purchase Platform *</Label>
            <Input
              id="purchase_platform"
              {...register("purchase_platform")}
              className={inputClass}
              placeholder="e.g. eBay"
            />
            {errors.purchase_platform && <p className={errorClass}>{errors.purchase_platform.message}</p>}
          </div>

          <div className="space-y-1">
            <Label htmlFor="purchase_year" className={labelClass}>Purchase Year *</Label>
            <Select
              defaultValue={initialData?.purchase_year != null ? String(initialData.purchase_year) : undefined}
              onValueChange={(v) => setValue("purchase_year", parseInt(v, 10), { shouldValidate: true })}
            >
              <SelectTrigger id="purchase_year" className={inputClass}>
                <SelectValue placeholder="Select year" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                {yearOptions.map((y) => (
                  <SelectItem key={y} value={String(y)} className="text-foreground focus:bg-secondary">
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.purchase_year && <p className={errorClass}>{errors.purchase_year.message}</p>}
          </div>

          <div className="space-y-1">
            <Label htmlFor="purchase_month" className={labelClass}>Purchase Month *</Label>
            <Select
              defaultValue={initialData?.purchase_month != null ? String(initialData.purchase_month) : undefined}
              onValueChange={(v) => setValue("purchase_month", parseInt(v, 10), { shouldValidate: true })}
            >
              <SelectTrigger id="purchase_month" className={inputClass}>
                <SelectValue placeholder="Select month" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                {MONTHS.map((m) => (
                  <SelectItem key={m.value} value={String(m.value)} className="text-foreground focus:bg-secondary">
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.purchase_month && <p className={errorClass}>{errors.purchase_month.message}</p>}
          </div>
        </div>

        {/* Is Preorder */}
        <div className="flex items-center gap-3 pt-2">
          <Checkbox
            id="is_preorder"
            checked={isPreorder}
            onCheckedChange={(checked) => {
              const val = checked === true;
              setIsPreorder(val);
              setValue("is_preorder", val, { shouldValidate: true });
              if (!val) {
                setValue("received_year", null, { shouldValidate: false });
                setValue("received_month", null, { shouldValidate: false });
              }
            }}
            className="border-border data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
          />
          <Label htmlFor="is_preorder" className={labelClass}>Is Preorder</Label>
        </div>

        {/* Received fields — shown only when is_preorder=true */}
        {isPreorder && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pl-4 border-l-2 border-blue-600/40">
            <div className="space-y-1">
              <Label htmlFor="received_year" className={labelClass}>Received Year</Label>
              <Select
                defaultValue={initialData?.received_year != null ? String(initialData.received_year) : undefined}
                onValueChange={(v) => setValue("received_year", parseInt(v, 10), { shouldValidate: true })}
              >
                <SelectTrigger id="received_year" className={inputClass}>
                  <SelectValue placeholder="Select year" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {yearOptions.map((y) => (
                    <SelectItem key={y} value={String(y)} className="text-foreground focus:bg-secondary">
                      {y}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.received_year && <p className={errorClass}>{errors.received_year.message}</p>}
            </div>

            <div className="space-y-1">
              <Label htmlFor="received_month" className={labelClass}>Received Month</Label>
              <Select
                defaultValue={initialData?.received_month != null ? String(initialData.received_month) : undefined}
                onValueChange={(v) => setValue("received_month", parseInt(v, 10), { shouldValidate: true })}
              >
                <SelectTrigger id="received_month" className={inputClass}>
                  <SelectValue placeholder="Select month" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {MONTHS.map((m) => (
                    <SelectItem key={m.value} value={String(m.value)} className="text-foreground focus:bg-secondary">
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.received_month && <p className={errorClass}>{errors.received_month.message}</p>}
            </div>
          </div>
        )}
      </div>

      {/* Sale Section */}
      <div className="bg-card border border-border rounded-xl p-6 space-y-4">
        <h2 className="text-foreground font-semibold text-lg">Sale</h2>

        {/* Is Sold */}
        <div className="flex items-center gap-3">
          <Checkbox
            id="is_sold"
            checked={isSold}
            onCheckedChange={(checked) => {
              const val = checked === true;
              setIsSold(val);
              setValue("is_sold", val, { shouldValidate: true });
              if (!val) {
                setValue("sold_price", null, { shouldValidate: false });
                setValue("sold_platform", null, { shouldValidate: false });
                setValue("sold_year", null, { shouldValidate: false });
                setValue("sold_month", null, { shouldValidate: false });
              }
            }}
            className="border-border data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
          />
          <Label htmlFor="is_sold" className={labelClass}>Is Sold</Label>
        </div>

        {/* Sold fields — shown only when is_sold=true */}
        {isSold && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pl-4 border-l-2 border-green-600/40">
            <div className="space-y-1">
              <Label htmlFor="sold_price" className={labelClass}>Sold Price (dollars) *</Label>
              <Input
                id="sold_price"
                type="number"
                min={0}
                {...register("sold_price", { valueAsNumber: true })}
                className={inputClass}
                placeholder="e.g. 30"
              />
              {errors.sold_price && <p className={errorClass}>{errors.sold_price.message}</p>}
            </div>

            <div className="space-y-1">
              <Label htmlFor="sold_platform" className={labelClass}>Sold Platform *</Label>
              <Input
                id="sold_platform"
                {...register("sold_platform")}
                className={inputClass}
                placeholder="e.g. eBay"
              />
              {errors.sold_platform && <p className={errorClass}>{errors.sold_platform.message}</p>}
            </div>

            <div className="space-y-1">
              <Label htmlFor="sold_year" className={labelClass}>Sold Year *</Label>
              <Select
                defaultValue={initialData?.sold_year != null ? String(initialData.sold_year) : undefined}
                onValueChange={(v) => setValue("sold_year", parseInt(v, 10), { shouldValidate: true })}
              >
                <SelectTrigger id="sold_year" className={inputClass}>
                  <SelectValue placeholder="Select year" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {yearOptions.map((y) => (
                    <SelectItem key={y} value={String(y)} className="text-foreground focus:bg-secondary">
                      {y}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.sold_year && <p className={errorClass}>{errors.sold_year.message}</p>}
            </div>

            <div className="space-y-1">
              <Label htmlFor="sold_month" className={labelClass}>Sold Month *</Label>
              <Select
                defaultValue={initialData?.sold_month != null ? String(initialData.sold_month) : undefined}
                onValueChange={(v) => setValue("sold_month", parseInt(v, 10), { shouldValidate: true })}
              >
                <SelectTrigger id="sold_month" className={inputClass}>
                  <SelectValue placeholder="Select month" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {MONTHS.map((m) => (
                    <SelectItem key={m.value} value={String(m.value)} className="text-foreground focus:bg-secondary">
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.sold_month && <p className={errorClass}>{errors.sold_month.message}</p>}
            </div>
          </div>
        )}
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
        ) : itemId ? (
          "Save Changes"
        ) : (
          "Add Item"
        )}
      </Button>
    </form>
  );
}
