"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { updateUserSettings } from "@/lib/actions/settings";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

interface SettingsFormProps {
  collectingSinceYear: number;
}

export default function SettingsForm({ collectingSinceYear }: SettingsFormProps) {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(collectingSinceYear);
  const [isPending, startTransition] = useTransition();

  const years: number[] = [];
  for (let y = currentYear; y >= 1900; y--) {
    years.push(y);
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    startTransition(async () => {
      const result = await updateUserSettings(selectedYear);
      if (result && "error" in result) {
        toast.error(result.error);
      } else {
        toast.success("Settings saved");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="collecting_since_year" className="text-slate-200">
          Collecting Since Year
        </Label>
        <select
          id="collecting_since_year"
          value={selectedYear}
          onChange={(e) => setSelectedYear(Number(e.target.value))}
          className="w-full rounded-md border border-slate-600 bg-slate-900 text-slate-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
        >
          {years.map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </select>
        <p className="text-xs text-slate-400">
          The earliest year you have been collecting model cars. Used as the minimum year in all
          date-related year fields throughout the app.
        </p>
      </div>
      <Button type="submit" disabled={isPending}>
        {isPending ? "Saving..." : "Save Settings"}
      </Button>
    </form>
  );
}
