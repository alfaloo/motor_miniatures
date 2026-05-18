"use client";

import { useState, useTransition, useRef } from "react";
import { toast } from "sonner";
import { Plus, Check, X, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { updateListingPrivateInfo } from "@/lib/actions/marketplace";
import type { SalesRecord } from "@/db/schema";
import { salesRecordSchema } from "@/lib/validations/listing";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function formatSaleRow(record: SalesRecord): string {
  const monthName = MONTH_NAMES[record.sale_month - 1] ?? "";
  const shortMonth = monthName.slice(0, 3);
  return `${shortMonth} ${record.sale_year}`;
}

function formatSalePrice(price: number): string {
  return "$" + price.toLocaleString();
}

function sortRecords(records: SalesRecord[]): SalesRecord[] {
  return [...records].sort((a, b) => {
    if (b.sale_year !== a.sale_year) return b.sale_year - a.sale_year;
    return b.sale_month - a.sale_month;
  });
}

type PrivateInfoPanelProps = {
  listingId: string;
  privateComments: string | null;
  salesRecords: SalesRecord[];
  totalPrice: number;
  collectingSinceYear: number;
};

export function PrivateInfoPanel({
  listingId,
  privateComments,
  salesRecords: initialSalesRecords,
  totalPrice,
  collectingSinceYear,
}: PrivateInfoPanelProps) {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  // Comments state
  const [comments, setComments] = useState(privateComments ?? "");
  const [isCommentsPending, startCommentsTransition] = useTransition();

  // Sales records state
  const [salesRecords, setSalesRecords] = useState<SalesRecord[]>(initialSalesRecords);
  const [isSalesPending, startSalesTransition] = useTransition();

  // Add form state
  const [addFormOpen, setAddFormOpen] = useState(false);
  const [addYear, setAddYear] = useState(String(currentYear));
  const [addMonth, setAddMonth] = useState(String(currentMonth));
  const [addPrice, setAddPrice] = useState(String(totalPrice));
  const [addError, setAddError] = useState<string | null>(null);
  const yearInputRef = useRef<HTMLInputElement>(null);

  function openAddForm() {
    setAddYear(String(currentYear));
    setAddMonth(String(currentMonth));
    setAddPrice(String(totalPrice));
    setAddError(null);
    setAddFormOpen(true);
    setTimeout(() => yearInputRef.current?.focus(), 0);
  }

  function closeAddForm() {
    setAddFormOpen(false);
    setAddError(null);
  }

  function handleCommentsBlur() {
    const trimmed = comments.trim() || null;
    startCommentsTransition(async () => {
      const result = await updateListingPrivateInfo(listingId, trimmed, salesRecords);
      if (result.success) {
        toast.success("Saved");
      }
    });
  }

  function handleAddSubmit() {
    const year = parseInt(addYear, 10);
    const month = parseInt(addMonth, 10);
    const price = parseInt(addPrice, 10);

    const validation = salesRecordSchema.safeParse({
      id: "00000000-0000-0000-0000-000000000000", // placeholder for validation
      sale_year: year,
      sale_month: month,
      sale_price: price,
    });

    if (!validation.success) {
      const firstError = validation.error.errors[0];
      setAddError(firstError?.message ?? "Invalid input");
      return;
    }

    const newRecord: SalesRecord = {
      id: crypto.randomUUID(),
      sale_year: year,
      sale_month: month,
      sale_price: price,
    };

    const optimisticRecords = [newRecord, ...salesRecords];
    setSalesRecords(optimisticRecords);

    startSalesTransition(async () => {
      const result = await updateListingPrivateInfo(
        listingId,
        comments.trim() || null,
        optimisticRecords
      );
      if (result.success) {
        setAddFormOpen(false);
        setAddError(null);
      } else {
        // Revert optimistic state
        setSalesRecords(salesRecords);
        setAddError(result.error ?? "Failed to save record");
      }
    });
  }

  function handleDelete(id: string) {
    const updated = salesRecords.filter((r) => r.id !== id);
    setSalesRecords(updated);
    startSalesTransition(async () => {
      const result = await updateListingPrivateInfo(
        listingId,
        comments.trim() || null,
        updated
      );
      if (!result.success) {
        // Revert
        setSalesRecords(salesRecords);
      }
    });
  }

  const sortedRecords = sortRecords(salesRecords);

  return (
    <div className="bg-card border border-border rounded-xl p-4 sm:p-6 space-y-4">
      <h2 className="text-base font-semibold text-foreground">Private Info</h2>

      {/* Comments sub-section */}
      <div className="space-y-1.5">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Comments
        </p>
        <textarea
          value={comments}
          onChange={(e) => setComments(e.target.value)}
          onBlur={handleCommentsBlur}
          placeholder="Internal notes…"
          disabled={isCommentsPending}
          rows={3}
          className="w-full resize-none rounded-md border border-border bg-secondary px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-50"
        />
      </div>

      {/* Sales Records sub-section */}
      <div className="space-y-1.5">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Sales Records
        </p>

        {/* Record rows */}
        <div className="space-y-0.5">
          {sortedRecords.map((record) => (
            <div key={record.id} className="flex items-center gap-2 py-1 group">
              <span className="flex-1 text-sm text-foreground">
                {formatSaleRow(record)}
              </span>
              <span className="text-sm text-muted-foreground tabular-nums">
                {formatSalePrice(record.sale_price)}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-red-400/70 hover:text-red-400 hover:bg-red-900/20 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                onClick={() => handleDelete(record.id)}
                disabled={isSalesPending}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
        </div>

        {/* Add form or Add button */}
        {addFormOpen ? (
          <div className="mt-2 space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <Input
                ref={yearInputRef}
                type="number"
                value={addYear}
                onChange={(e) => setAddYear(e.target.value)}
                placeholder="Year"
                min={collectingSinceYear}
                max={currentYear + 1}
                step="1"
                className="h-8 text-sm bg-secondary border-border w-20"
                disabled={isSalesPending}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleAddSubmit();
                  if (e.key === "Escape") closeAddForm();
                }}
              />
              <select
                value={addMonth}
                onChange={(e) => setAddMonth(e.target.value)}
                disabled={isSalesPending}
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
                value={addPrice}
                onChange={(e) => setAddPrice(e.target.value)}
                placeholder="Price"
                min="0"
                step="1"
                className="h-8 text-sm bg-secondary border-border w-24"
                disabled={isSalesPending}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleAddSubmit();
                  if (e.key === "Escape") closeAddForm();
                }}
              />
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-green-400 hover:text-green-300 hover:bg-green-900/20 shrink-0"
                onClick={handleAddSubmit}
                disabled={isSalesPending}
              >
                <Check className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-foreground shrink-0"
                onClick={closeAddForm}
                disabled={isSalesPending}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            {addError && <p className="text-xs text-red-400">{addError}</p>}
          </div>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            className="mt-1 h-7 text-xs text-muted-foreground hover:text-foreground gap-1 px-2"
            onClick={openAddForm}
          >
            <Plus className="h-3 w-3" />
            Add sale record
          </Button>
        )}
      </div>
    </div>
  );
}
