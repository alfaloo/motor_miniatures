"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { updateUserSettings, updateUsername } from "@/lib/actions/settings";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface SettingsFormProps {
  collectingSinceYear: number;
  username: string;
}

export default function SettingsForm({ collectingSinceYear, username }: SettingsFormProps) {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(collectingSinceYear);
  const [isPending, startTransition] = useTransition();

  const [usernameInput, setUsernameInput] = useState(username);
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [isPendingUsername, startUsernameTransition] = useTransition();

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

  function handleUsernameSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setUsernameError(null);
    startUsernameTransition(async () => {
      const result = await updateUsername(usernameInput);
      if (result && "error" in result && result.error) {
        if (result.error.includes("already taken")) {
          setUsernameError(result.error);
        } else {
          toast.error(result.error);
        }
      } else {
        toast.success("Username updated");
      }
    });
  }

  return (
    <div className="space-y-8">
      <form onSubmit={handleUsernameSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="username" className="text-slate-200">
            Username
          </Label>
          <Input
            id="username"
            value={usernameInput}
            onChange={(e) => {
              setUsernameInput(e.target.value);
              setUsernameError(null);
            }}
            className="w-full rounded-md border border-slate-600 bg-slate-900 text-slate-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
            maxLength={32}
          />
          {usernameError && (
            <p className="text-xs text-red-400">{usernameError}</p>
          )}
          <p className="text-xs text-slate-400">
            Your unique username used to log in to the app.
          </p>
        </div>
        <Button type="submit" disabled={isPendingUsername}>
          {isPendingUsername ? "Saving..." : "Save Username"}
        </Button>
      </form>

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
    </div>
  );
}
