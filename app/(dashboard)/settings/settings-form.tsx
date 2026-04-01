"use client";

import { useState, useTransition } from "react";
import { updateGeneralSettings, updateDisplaySettings, updateAccountSettings } from "@/lib/actions/settings";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

interface SettingsFormProps {
  collectingSinceYear: number;
  monthsLookBack: number;
  topValuesCount: number;
  username: string;
  theme: string;
}

type FieldStatus = "idle" | "success" | "error";

function getInputClass(status: FieldStatus): string {
  const base =
    "rounded-md border border-slate-600 bg-slate-900 text-slate-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600";
  if (status === "success") return `${base} ring-2 ring-green-500`;
  if (status === "error") return `${base} ring-2 ring-red-500`;
  return base;
}

export default function SettingsForm({
  collectingSinceYear,
  monthsLookBack,
  topValuesCount,
  username,
  theme,
}: SettingsFormProps) {
  const currentYear = new Date().getFullYear();

  // General panel state
  const [selectedYear, setSelectedYear] = useState(collectingSinceYear);
  const [monthsInput, setMonthsInput] = useState(monthsLookBack);
  const [topValuesInput, setTopValuesInput] = useState(topValuesCount);
  const [isPendingGeneral, startGeneralTransition] = useTransition();

  const [yearStatus, setYearStatus] = useState<FieldStatus>("idle");
  const [yearError, setYearError] = useState<string | null>(null);
  const [monthsStatus, setMonthsStatus] = useState<FieldStatus>("idle");
  const [monthsError, setMonthsError] = useState<string | null>(null);
  const [topValuesStatus, setTopValuesStatus] = useState<FieldStatus>("idle");
  const [topValuesError, setTopValuesError] = useState<string | null>(null);

  // Account panel state
  const [usernameInput, setUsernameInput] = useState(username);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isPendingAccount, startAccountTransition] = useTransition();

  const [usernameStatus, setUsernameStatus] = useState<FieldStatus>("idle");
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [passwordStatus, setPasswordStatus] = useState<FieldStatus>("idle");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordClientError, setPasswordClientError] = useState<string | null>(null);

  // Display panel state
  const [selectedTheme, setSelectedTheme] = useState(theme);
  const [isPendingDisplay, startDisplayTransition] = useTransition();
  const [themeStatus, setThemeStatus] = useState<FieldStatus>("idle");
  const [themeError, setThemeError] = useState<string | null>(null);

  const years: number[] = [];
  for (let y = currentYear; y >= 1900; y--) {
    years.push(y);
  }

  function handleGeneralSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setYearError(null);
    setMonthsError(null);
    setTopValuesError(null);
    setYearStatus("idle");
    setMonthsStatus("idle");
    setTopValuesStatus("idle");

    startGeneralTransition(async () => {
      const results = await updateGeneralSettings(selectedYear, monthsInput, topValuesInput);

      // Collecting Since Year
      if (results.collectingSinceYear === "success") {
        setYearStatus("success");
      } else if (results.collectingSinceYear === "unchanged") {
        setYearStatus("idle");
      } else {
        setYearStatus("error");
        setYearError(results.collectingSinceYear.error);
      }

      // Months to Look Back
      if (results.monthsLookBack === "success") {
        setMonthsStatus("success");
      } else if (results.monthsLookBack === "unchanged") {
        setMonthsStatus("idle");
      } else {
        setMonthsStatus("error");
        setMonthsError(results.monthsLookBack.error);
      }

      // Top Values to Display
      if (results.topValuesCount === "success") {
        setTopValuesStatus("success");
      } else if (results.topValuesCount === "unchanged") {
        setTopValuesStatus("idle");
      } else {
        setTopValuesStatus("error");
        setTopValuesError(results.topValuesCount.error);
      }
    });
  }

  function resolveTheme(themeValue: string): "light" | "dark" {
    if (themeValue === "light") return "light";
    if (themeValue === "clock") {
      const hour = new Date().getHours();
      return hour >= 7 && hour < 19 ? "light" : "dark";
    }
    return "dark";
  }

  function handleDisplaySubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setThemeError(null);
    setThemeStatus("idle");

    startDisplayTransition(async () => {
      const result = await updateDisplaySettings(selectedTheme);
      if (result.success) {
        setThemeStatus("success");
        const resolved = resolveTheme(selectedTheme);
        document.documentElement.setAttribute("data-theme", resolved);
        document.cookie = `theme-resolved=${resolved};path=/;max-age=${60 * 60 * 24 * 365};SameSite=Lax`;
      } else {
        setThemeStatus("error");
        setThemeError(result.error ?? "Failed to save display settings");
      }
    });
  }

  function handleAccountSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setUsernameError(null);
    setPasswordError(null);
    setPasswordClientError(null);
    setUsernameStatus("idle");
    setPasswordStatus("idle");

    // Client-side validation: if any password field is filled but current password is empty
    const anyPasswordFilled = newPassword || confirmPassword || currentPassword;
    if (anyPasswordFilled && !currentPassword) {
      setPasswordClientError("Current password is required to change your password.");
      return;
    }

    startAccountTransition(async () => {
      const results = await updateAccountSettings(
        usernameInput,
        username,
        currentPassword,
        newPassword,
        confirmPassword
      );

      // Username feedback
      if (results.username === "success") {
        setUsernameStatus("success");
      } else if (results.username === "unchanged") {
        setUsernameStatus("idle");
      } else {
        setUsernameStatus("error");
        setUsernameError(results.username.error);
      }

      // Password feedback
      if (results.password === "success") {
        setPasswordStatus("success");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else if (results.password === "unchanged") {
        setPasswordStatus("idle");
      } else {
        setPasswordStatus("error");
        setPasswordError(results.password.error);
      }
    });
  }

  return (
    <div className="space-y-6">
      {/* General Panel */}
      <div className="bg-card border border-border rounded-xl p-6">
        <h2 className="text-lg font-semibold text-foreground mb-4">General</h2>
        <form onSubmit={handleGeneralSubmit} className="space-y-5">
          {/* Collecting Since Year */}
          <div className="space-y-1">
            <Label htmlFor="collecting_since_year" className="text-foreground">
              Collecting Since Year
            </Label>
            <select
              id="collecting_since_year"
              value={selectedYear}
              onChange={(e) => {
                setSelectedYear(Number(e.target.value));
                setYearStatus("idle");
                setYearError(null);
              }}
              className={`w-32 ${getInputClass(yearStatus)}`}
            >
              {years.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
            {yearError && <p className="text-xs text-red-400">{yearError}</p>}
            <p className="text-xs text-muted-foreground">
              The earliest year you have been collecting model cars. Used as the minimum year in all
              date-related year fields throughout the app.
            </p>
          </div>

          {/* Months to Look Back */}
          <div className="space-y-1">
            <Label htmlFor="months_look_back" className="text-foreground">
              Months to Look Back
            </Label>
            <input
              id="months_look_back"
              type="number"
              min={3}
              max={24}
              value={monthsInput}
              onChange={(e) => {
                setMonthsInput(Number(e.target.value));
                setMonthsStatus("idle");
                setMonthsError(null);
              }}
              className={`w-32 ${getInputClass(monthsStatus)}`}
            />
            {monthsError && <p className="text-xs text-red-400">{monthsError}</p>}
            <p className="text-xs text-muted-foreground">
              Applies to Purchase Value Per Month and Models Purchased Per Month charts
            </p>
          </div>

          {/* Top Values to Display */}
          <div className="space-y-1">
            <Label htmlFor="top_values_count" className="text-foreground">
              Top Values to Display
            </Label>
            <input
              id="top_values_count"
              type="number"
              min={3}
              max={24}
              value={topValuesInput}
              onChange={(e) => {
                setTopValuesInput(Number(e.target.value));
                setTopValuesStatus("idle");
                setTopValuesError(null);
              }}
              className={`w-32 ${getInputClass(topValuesStatus)}`}
            />
            {topValuesError && <p className="text-xs text-red-400">{topValuesError}</p>}
            <p className="text-xs text-muted-foreground">
              Applies to Model Brands in Collection and Car Makes in Collection charts
            </p>
          </div>

          <Button type="submit" disabled={isPendingGeneral}>
            {isPendingGeneral ? "Saving..." : "Save General Settings"}
          </Button>
        </form>
      </div>

      {/* Display Panel */}
      <div className="bg-card border border-border rounded-xl p-6">
        <h2 className="text-lg font-semibold text-foreground mb-4">Display</h2>
        <form onSubmit={handleDisplaySubmit} className="space-y-5">
          <div className="space-y-1">
            <Label htmlFor="colour_theme" className="text-foreground">
              Colour Theme
            </Label>
            <select
              id="colour_theme"
              value={selectedTheme}
              onChange={(e) => {
                setSelectedTheme(e.target.value);
                setThemeStatus("idle");
                setThemeError(null);
              }}
              className={`w-48 ${getInputClass(themeStatus)}`}
            >
              <option value="dark">Dark Mode</option>
              <option value="light">Light Mode</option>
              <option value="clock">Clock Sync</option>
            </select>
            {themeError && <p className="text-xs text-red-400">{themeError}</p>}
            <p className="text-xs text-muted-foreground">
              Clock Sync applies Light Mode from 07:00–19:00 and Dark Mode at night.
            </p>
          </div>

          <Button type="submit" disabled={isPendingDisplay}>
            {isPendingDisplay ? "Saving..." : "Save Display Settings"}
          </Button>
        </form>
      </div>

      {/* Account Panel */}
      <div className="bg-card border border-border rounded-xl p-6">
        <h2 className="text-lg font-semibold text-foreground mb-4">Account</h2>
        <form onSubmit={handleAccountSubmit} className="space-y-5">
          {/* Username */}
          <div className="space-y-1">
            <Label htmlFor="account_username" className="text-foreground">
              Username
            </Label>
            <input
              id="account_username"
              type="text"
              value={usernameInput}
              onChange={(e) => {
                setUsernameInput(e.target.value);
                setUsernameStatus("idle");
                setUsernameError(null);
              }}
              className={`w-64 ${getInputClass(usernameStatus)}`}
            />
            {usernameError && <p className="text-xs text-red-400">{usernameError}</p>}
          </div>

          {/* Current Password */}
          <div className="space-y-1">
            <Label htmlFor="current_password" className="text-foreground">
              Current Password
            </Label>
            <input
              id="current_password"
              type="password"
              value={currentPassword}
              onChange={(e) => {
                setCurrentPassword(e.target.value);
                setPasswordStatus("idle");
                setPasswordError(null);
                setPasswordClientError(null);
              }}
              className={`w-64 ${getInputClass(passwordStatus)}`}
            />
          </div>

          {/* New Password */}
          <div className="space-y-1">
            <Label htmlFor="new_password" className="text-foreground">
              New Password
            </Label>
            <input
              id="new_password"
              type="password"
              value={newPassword}
              onChange={(e) => {
                setNewPassword(e.target.value);
                setPasswordStatus("idle");
                setPasswordError(null);
                setPasswordClientError(null);
              }}
              className={`w-64 ${getInputClass(passwordStatus)}`}
            />
          </div>

          {/* Confirm New Password */}
          <div className="space-y-1">
            <Label htmlFor="confirm_password" className="text-foreground">
              Confirm New Password
            </Label>
            <input
              id="confirm_password"
              type="password"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                setPasswordStatus("idle");
                setPasswordError(null);
                setPasswordClientError(null);
              }}
              className={`w-64 ${getInputClass(passwordStatus)}`}
            />
            {passwordClientError && <p className="text-xs text-red-400">{passwordClientError}</p>}
            {passwordError && <p className="text-xs text-red-400">{passwordError}</p>}
          </div>

          <Button type="submit" disabled={isPendingAccount}>
            {isPendingAccount ? "Saving..." : "Save Account Settings"}
          </Button>
        </form>
      </div>
    </div>
  );
}
