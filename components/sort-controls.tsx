"use client";

import { useRouter } from "next/navigation";
import { ArrowUp, ArrowDown } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";

const SORT_OPTIONS = [
  { value: "purchase_date", label: "Purchase Date" },
  { value: "purchase_price", label: "Purchase Price" },
  { value: "sold_price", label: "Sale Price" },
  { value: "serial_number", label: "Serial Number" },
  { value: "production_count", label: "Production Count" },
  { value: "grade", label: "Grade" },
] as const;

const DEFAULT_SORT = "purchase_date";
const DEFAULT_DIR = "desc";

interface SortControlsProps {
  currentSort: string;
  currentDir: string;
  searchParams: Record<string, string>;
}

export function SortControls({
  currentSort,
  currentDir,
  searchParams,
}: SortControlsProps) {
  const router = useRouter();

  function buildUrl(sort: string, dir: string): string {
    const params = new URLSearchParams();

    // Carry over non-sort params (e.g. filters, but reset page to 1)
    for (const [key, value] of Object.entries(searchParams)) {
      if (key !== "sort" && key !== "dir" && key !== "page") {
        params.set(key, value);
      }
    }

    // Only add sort/dir if they differ from defaults
    const isDefault = sort === DEFAULT_SORT && dir === DEFAULT_DIR;
    if (!isDefault) {
      params.set("sort", sort);
      params.set("dir", dir);
    }

    const qs = params.toString();
    return qs ? `/?${qs}` : "/";
  }

  function handleSortChange(newSort: string) {
    router.push(buildUrl(newSort, currentDir));
  }

  function handleDirToggle() {
    const newDir = currentDir === "asc" ? "desc" : "asc";
    router.push(buildUrl(currentSort, newDir));
  }

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1">
        <span className="text-sm text-slate-400 whitespace-nowrap">Sort:</span>
        <Select value={currentSort} onValueChange={handleSortChange}>
          <SelectTrigger className="h-9 w-[160px] bg-slate-800 border-slate-700 text-slate-200 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Button
        variant="outline"
        size="icon"
        className="h-9 w-9 bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700"
        onClick={handleDirToggle}
        aria-label={currentDir === "asc" ? "Sort ascending" : "Sort descending"}
      >
        {currentDir === "asc" ? (
          <ArrowUp className="h-4 w-4" />
        ) : (
          <ArrowDown className="h-4 w-4" />
        )}
      </Button>
    </div>
  );
}
