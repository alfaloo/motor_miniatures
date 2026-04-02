"use client";

import { useState, useTransition } from "react";
import { useTheme } from "next-themes";
import { updateGeneralSettings, updateDisplaySettings, updateUsername, updatePassword } from "@/lib/actions/settings";
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
    "h-9 rounded-md border border-border bg-secondary text-foreground px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring";
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
  const [monthsInput, setMonthsInput] = useState(String(monthsLookBack));
  const [topValuesInput, setTopValuesInput] = useState(String(topValuesCount));
  const [isPendingGeneral, startGeneralTransition] = useTransition();

  const [yearStatus, setYearStatus] = useState<FieldStatus>("idle");
  const [yearError, setYearError] = useState<string | null>(null);
  const [monthsStatus, setMonthsStatus] = useState<FieldStatus>("idle");
  const [monthsError, setMonthsError] = useState<string | null>(null);
  const [topValuesStatus, setTopValuesStatus] = useState<FieldStatus>("idle");
  const [topValuesError, setTopValuesError] = useState<string | null>(null);

  // Account panel — username state
  const [usernameInput, setUsernameInput] = useState(username);
  const [isPendingUsername, startUsernameTransition] = useTransition();
  const [usernameStatus, setUsernameStatus] = useState<FieldStatus>("idle");
  const [usernameError, setUsernameError] = useState<string | null>(null);

  // Account panel — password state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isPendingPassword, startPasswordTransition] = useTransition();
  const [passwordStatus, setPasswordStatus] = useState<FieldStatus>("idle");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordClientError, setPasswordClientError] = useState<string | null>(null);

  // Display panel state
  const [selectedTheme, setSelectedTheme] = useState(theme);
  const [isPendingDisplay, startDisplayTransition] = useTransition();
  const [themeStatus, setThemeStatus] = useState<FieldStatus>("idle");
  const [themeError, setThemeError] = useState<string | null>(null);
  const { setTheme } = useTheme();

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
      const results = await updateGeneralSettings(selectedYear, Number(monthsInput), Number(topValuesInput));

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

  function handleDisplaySubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setThemeError(null);
    setThemeStatus("idle");

    startDisplayTransition(async () => {
      const result = await updateDisplaySettings(selectedTheme);
      if (result.success) {
        setThemeStatus("success");
        if (selectedTheme === "time") {
          const hour = new Date().getHours();
          setTheme(hour >= 7 && hour < 19 ? "light" : "dark");
        } else {
          setTheme(selectedTheme);
        }
      } else {
        setThemeStatus("error");
        setThemeError(result.error ?? "Failed to save display settings");
      }
    });
  }

  function handleUsernameSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setUsernameError(null);
    setUsernameStatus("idle");
    startUsernameTransition(async () => {
      const result = await updateUsername(usernameInput);
      if (result && "error" in result && result.error) {
        setUsernameStatus("error");
        setUsernameError(result.error);
      } else {
        setUsernameStatus("success");
      }
    });
  }

  function handlePasswordSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPasswordError(null);
    setPasswordClientError(null);
    setPasswordStatus("idle");
    if (newPassword !== confirmPassword) {
      setPasswordClientError("New password and confirm password do not match.");
      return;
    }
    startPasswordTransition(async () => {
      const result = await updatePassword(currentPassword, newPassword);
      if (result && "error" in result && result.error) {
        setPasswordStatus("error");
        setPasswordError(result.error);
      } else {
        setPasswordStatus("success");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
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
          <div className="space-y-2">
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
              className={`w-full ${getInputClass(yearStatus)}`}
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
          <div className="space-y-2">
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
                setMonthsInput(e.target.value);
                setMonthsStatus("idle");
                setMonthsError(null);
              }}
              className={`w-full ${getInputClass(monthsStatus)}`}
            />
            {monthsError && <p className="text-xs text-red-400">{monthsError}</p>}
            <p className="text-xs text-muted-foreground">
              Applies to Purchase Value Per Month and Models Purchased Per Month charts
            </p>
          </div>

          {/* Top Values to Display */}
          <div className="space-y-2">
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
                setTopValuesInput(e.target.value);
                setTopValuesStatus("idle");
                setTopValuesError(null);
              }}
              className={`w-full ${getInputClass(topValuesStatus)}`}
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
          <div className="space-y-2">
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
              className={`w-full ${getInputClass(themeStatus)}`}
            >
              <option value="dark">Dark</option>
              <option value="light">Light</option>
              <option value="time">Sync with Time</option>
              <option value="system">Sync with OS</option>
            </select>
            {themeError && <p className="text-xs text-red-400">{themeError}</p>}
            <p className="text-xs text-muted-foreground">
              Sync with Time applies Light Mode from 07:00–19:00 and Dark Mode at night. Sync with OS follows your system preference.
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
        <div className="space-y-8">
          {/* Username form */}
          <form onSubmit={handleUsernameSubmit} className="space-y-4">
            <div className="space-y-2">
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
                className={`w-full ${getInputClass(usernameStatus)}`}
                maxLength={32}
              />
              {usernameError && <p className="text-xs text-red-400">{usernameError}</p>}
              <p className="text-xs text-muted-foreground">
                Your unique username used to log in to the app.
              </p>
            </div>
            <Button type="submit" disabled={isPendingUsername}>
              {isPendingUsername ? "Saving..." : "Save Username"}
            </Button>
          </form>

          {/* Password form */}
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="current_password" className="text-foreground">
                Change Password
              </Label>
              <input
                id="current_password"
                type="password"
                placeholder="Current password"
                value={currentPassword}
                onChange={(e) => {
                  setCurrentPassword(e.target.value);
                  setPasswordStatus("idle");
                  setPasswordError(null);
                  setPasswordClientError(null);
                }}
                className={`w-full ${getInputClass(passwordStatus)}`}
              />
              <input
                id="new_password"
                type="password"
                placeholder="New password"
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  setPasswordStatus("idle");
                  setPasswordError(null);
                  setPasswordClientError(null);
                }}
                className={`w-full ${getInputClass(passwordStatus)}`}
              />
              <input
                id="confirm_password"
                type="password"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  setPasswordStatus("idle");
                  setPasswordError(null);
                  setPasswordClientError(null);
                }}
                className={`w-full ${getInputClass(passwordStatus)}`}
              />
              {passwordClientError && <p className="text-xs text-red-400">{passwordClientError}</p>}
              {passwordError && <p className="text-xs text-red-400">{passwordError}</p>}
            </div>
            <Button type="submit" disabled={isPendingPassword}>
              {isPendingPassword ? "Saving..." : "Save Password"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
