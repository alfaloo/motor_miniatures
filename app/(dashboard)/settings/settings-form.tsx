"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { updateUserSettings, updateUsername, updatePassword } from "@/lib/actions/settings";
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

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [isPendingPassword, startPasswordTransition] = useTransition();

  const years: number[] = [];
  for (let y = currentYear; y >= 1900; y--) {
    years.push(y);
  }

  function handlePasswordSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPasswordError(null);
    if (newPassword !== confirmPassword) {
      setPasswordError("New password and confirm password do not match");
      return;
    }
    startPasswordTransition(async () => {
      const result = await updatePassword(currentPassword, newPassword);
      if (result && "error" in result && result.error) {
        if (result.error === "Current password is incorrect") {
          setPasswordError(result.error);
        } else {
          toast.error(result.error);
        }
      } else {
        toast.success("Password updated");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      }
    });
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

      <form onSubmit={handlePasswordSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="current_password" className="text-slate-200">
            Change Password
          </Label>
          <Input
            id="current_password"
            type="password"
            placeholder="Current password"
            value={currentPassword}
            onChange={(e) => {
              setCurrentPassword(e.target.value);
              setPasswordError(null);
            }}
            className="w-full rounded-md border border-slate-600 bg-slate-900 text-slate-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
          <Input
            id="new_password"
            type="password"
            placeholder="New password"
            value={newPassword}
            onChange={(e) => {
              setNewPassword(e.target.value);
              setPasswordError(null);
            }}
            className="w-full rounded-md border border-slate-600 bg-slate-900 text-slate-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
          <Input
            id="confirm_password"
            type="password"
            placeholder="Confirm new password"
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value);
              setPasswordError(null);
            }}
            className="w-full rounded-md border border-slate-600 bg-slate-900 text-slate-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
          {passwordError && (
            <p className="text-xs text-red-400">{passwordError}</p>
          )}
        </div>
        <Button type="submit" disabled={isPendingPassword}>
          {isPendingPassword ? "Saving..." : "Save Password"}
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
