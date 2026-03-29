"use client";

import { useRef } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, X } from "lucide-react";

interface SearchFormProps {
  collectingSinceYear: number;
  defaultValues?: Record<string, string>;
}

const MONTHS = [
  { value: "1", label: "January" },
  { value: "2", label: "February" },
  { value: "3", label: "March" },
  { value: "4", label: "April" },
  { value: "5", label: "May" },
  { value: "6", label: "June" },
  { value: "7", label: "July" },
  { value: "8", label: "August" },
  { value: "9", label: "September" },
  { value: "10", label: "October" },
  { value: "11", label: "November" },
  { value: "12", label: "December" },
];

export function SearchForm({ collectingSinceYear, defaultValues = {} }: SearchFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const currentYear = new Date().getFullYear();

  const years: number[] = [];
  for (let y = currentYear; y >= collectingSinceYear; y--) {
    years.push(y);
  }

  function handleClear() {
    formRef.current?.reset();
  }

  return (
    <form
      ref={formRef}
      method="GET"
      action="/search"
      className="bg-slate-800 border border-slate-700 rounded-xl p-6 space-y-6"
    >
      {/* Text filters */}
      <div>
        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-4">
          Identity
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="brand" className="text-slate-300">Brand</Label>
            <Input
              id="brand"
              name="brand"
              placeholder="e.g. Autoart"
              defaultValue={defaultValues.brand ?? ""}
              className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-500"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="make" className="text-slate-300">Make</Label>
            <Input
              id="make"
              name="make"
              placeholder="e.g. Porsche"
              defaultValue={defaultValues.make ?? ""}
              className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-500"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="model" className="text-slate-300">Model</Label>
            <Input
              id="model"
              name="model"
              placeholder="e.g. 911 GT3"
              defaultValue={defaultValues.model ?? ""}
              className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-500"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="variant" className="text-slate-300">Variant</Label>
            <Input
              id="variant"
              name="variant"
              placeholder="e.g. Racing Edition"
              defaultValue={defaultValues.variant ?? ""}
              className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-500"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="scale" className="text-slate-300">Scale</Label>
            <Select name="scale" defaultValue={defaultValues.scale ?? "any"}>
              <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                <SelectValue placeholder="Any scale" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700 text-white">
                <SelectItem value="any">Any</SelectItem>
                <SelectItem value="1/18">1/18</SelectItem>
                <SelectItem value="1/24">1/24</SelectItem>
                <SelectItem value="1/43">1/43</SelectItem>
                <SelectItem value="1/64">1/64</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="grade" className="text-slate-300">Grade</Label>
            <Select name="grade" defaultValue={defaultValues.grade ?? "any"}>
              <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                <SelectValue placeholder="Any grade" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700 text-white">
                <SelectItem value="any">Any</SelectItem>
                <SelectItem value="ungraded">Ungraded</SelectItem>
                {[10, 9, 8, 7, 6, 5, 4, 3, 2, 1].map((g) => (
                  <SelectItem key={g} value={String(g)}>
                    {g}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Number filters */}
      <div>
        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-4">
          Details
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="serial_number" className="text-slate-300">Serial Number</Label>
            <Input
              id="serial_number"
              name="serial_number"
              type="number"
              placeholder="Exact match"
              defaultValue={defaultValues.serial_number ?? ""}
              className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-500"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="production_count" className="text-slate-300">Production Count</Label>
            <Input
              id="production_count"
              name="production_count"
              type="number"
              placeholder="Exact match"
              defaultValue={defaultValues.production_count ?? ""}
              className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-500"
            />
          </div>
        </div>
      </div>

      {/* Purchase filters */}
      <div>
        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-4">
          Purchase
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="purchase_platform" className="text-slate-300">Purchase Platform</Label>
            <Input
              id="purchase_platform"
              name="purchase_platform"
              placeholder="e.g. eBay"
              defaultValue={defaultValues.purchase_platform ?? ""}
              className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-500"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="purchase_price" className="text-slate-300">Purchase Price ($)</Label>
            <Input
              id="purchase_price"
              name="purchase_price"
              type="number"
              placeholder="Exact match"
              defaultValue={defaultValues.purchase_price ?? ""}
              className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-500"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="purchase_year" className="text-slate-300">Purchase Year</Label>
            <Select name="purchase_year" defaultValue={defaultValues.purchase_year ?? "any"}>
              <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                <SelectValue placeholder="Any year" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700 text-white">
                <SelectItem value="any">Any</SelectItem>
                {years.map((y) => (
                  <SelectItem key={y} value={String(y)}>
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="purchase_month" className="text-slate-300">Purchase Month</Label>
            <Select name="purchase_month" defaultValue={defaultValues.purchase_month ?? "any"}>
              <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                <SelectValue placeholder="Any month" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700 text-white">
                <SelectItem value="any">Any</SelectItem>
                {MONTHS.map((m) => (
                  <SelectItem key={m.value} value={m.value}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="is_preorder" className="text-slate-300">Is Preorder</Label>
            <Select name="is_preorder" defaultValue={defaultValues.is_preorder ?? "any"}>
              <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                <SelectValue placeholder="Any" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700 text-white">
                <SelectItem value="any">Any</SelectItem>
                <SelectItem value="yes">Yes</SelectItem>
                <SelectItem value="no">No</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Received filters */}
      <div>
        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-4">
          Received
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="received_year" className="text-slate-300">Received Year</Label>
            <Select name="received_year" defaultValue={defaultValues.received_year ?? "any"}>
              <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                <SelectValue placeholder="Any year" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700 text-white">
                <SelectItem value="any">Any</SelectItem>
                {years.map((y) => (
                  <SelectItem key={y} value={String(y)}>
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="received_month" className="text-slate-300">Received Month</Label>
            <Select name="received_month" defaultValue={defaultValues.received_month ?? "any"}>
              <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                <SelectValue placeholder="Any month" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700 text-white">
                <SelectItem value="any">Any</SelectItem>
                {MONTHS.map((m) => (
                  <SelectItem key={m.value} value={m.value}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Sale filters */}
      <div>
        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-4">
          Sale
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="is_sold" className="text-slate-300">Is Sold</Label>
            <Select name="is_sold" defaultValue={defaultValues.is_sold ?? "any"}>
              <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                <SelectValue placeholder="Any" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700 text-white">
                <SelectItem value="any">Any</SelectItem>
                <SelectItem value="yes">Yes</SelectItem>
                <SelectItem value="no">No</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="sold_price" className="text-slate-300">Sold Price ($)</Label>
            <Input
              id="sold_price"
              name="sold_price"
              type="number"
              placeholder="Exact match"
              defaultValue={defaultValues.sold_price ?? ""}
              className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-500"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="sold_platform" className="text-slate-300">Sold Platform</Label>
            <Input
              id="sold_platform"
              name="sold_platform"
              placeholder="e.g. eBay"
              defaultValue={defaultValues.sold_platform ?? ""}
              className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-500"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="sold_year" className="text-slate-300">Sold Year</Label>
            <Select name="sold_year" defaultValue={defaultValues.sold_year ?? "any"}>
              <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                <SelectValue placeholder="Any year" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700 text-white">
                <SelectItem value="any">Any</SelectItem>
                {years.map((y) => (
                  <SelectItem key={y} value={String(y)}>
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="sold_month" className="text-slate-300">Sold Month</Label>
            <Select name="sold_month" defaultValue={defaultValues.sold_month ?? "any"}>
              <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                <SelectValue placeholder="Any month" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700 text-white">
                <SelectItem value="any">Any</SelectItem>
                {MONTHS.map((m) => (
                  <SelectItem key={m.value} value={m.value}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 pt-2">
        <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white">
          <Search className="h-4 w-4 mr-2" />
          Search
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={handleClear}
          className="border-slate-600 bg-slate-700 hover:bg-slate-600 text-slate-200"
        >
          <X className="h-4 w-4 mr-2" />
          Clear
        </Button>
      </div>
    </form>
  );
}
