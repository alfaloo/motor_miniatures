"use client";

import { useState, useTransition } from "react";
import { useTheme } from "next-themes";
import { updateGeneralSettings, updateDisplaySettings, updateUsername, updatePassword, updateMarketplaceSettings } from "@/lib/actions/settings";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Plus, X } from "lucide-react";

interface SettingsFormProps {
  collectingSinceYear: number;
  monthsLookBack: number;
  topValuesCount: number;
  username: string;
  theme: string;
  currency: string;
  phoneNumber: string;
  emailAddress: string;
  socialLinks: { name: string; url: string }[];
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
  currency,
  phoneNumber,
  emailAddress,
  socialLinks: initialSocialLinks,
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

  // Marketplace panel state
  const [currencyInput, setCurrencyInput] = useState(currency);
  const [phoneInput, setPhoneInput] = useState(phoneNumber);
  const [emailInput, setEmailInput] = useState(emailAddress);
  const [socialLinksInput, setSocialLinksInput] = useState<{ name: string; url: string }[]>(initialSocialLinks);
  const [isPendingMarketplace, startMarketplaceTransition] = useTransition();
  const [currencyStatus, setCurrencyStatus] = useState<FieldStatus>("idle");
  const [currencyError, setCurrencyError] = useState<string | null>(null);
  const [phoneStatus, setPhoneStatus] = useState<FieldStatus>("idle");
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [emailStatus, setEmailStatus] = useState<FieldStatus>("idle");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [socialLinksStatus, setSocialLinksStatus] = useState<FieldStatus>("idle");
  const [socialLinksError, setSocialLinksError] = useState<string | null>(null);
  const [socialLinkErrors, setSocialLinkErrors] = useState<Record<number, { name?: boolean; url?: boolean }>>({});

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

  function handleMarketplaceSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setCurrencyStatus("idle"); setCurrencyError(null);
    setPhoneStatus("idle"); setPhoneError(null);
    setEmailStatus("idle"); setEmailError(null);
    setSocialLinksStatus("idle"); setSocialLinksError(null);
    setSocialLinkErrors({});

    startMarketplaceTransition(async () => {
      const result = await updateMarketplaceSettings({
        currency: currencyInput,
        phoneNumber: phoneInput || undefined,
        emailAddress: emailInput || undefined,
        socialLinks: socialLinksInput,
      });

      // Currency
      if (result.currency === "success") {
        setCurrencyStatus("success");
        setCurrencyInput((prev) => prev.trim().toUpperCase());
      } else if (result.currency !== "unchanged") {
        setCurrencyStatus("error");
        setCurrencyError(result.currency.error);
      }

      // Phone
      if (result.phoneNumber === "success") {
        setPhoneStatus("success");
      } else if (result.phoneNumber !== "unchanged") {
        setPhoneStatus("error");
        setPhoneError(result.phoneNumber.error);
      }

      // Email
      if (result.emailAddress === "success") {
        setEmailStatus("success");
      } else if (result.emailAddress !== "unchanged") {
        setEmailStatus("error");
        setEmailError(result.emailAddress.error);
      }

      // Social links
      if (result.socialLinks === "success") {
        setSocialLinksStatus("success");
        setSocialLinkErrors({});
      } else if (result.socialLinks !== "unchanged") {
        setSocialLinksStatus("error");
        setSocialLinksError(result.socialLinks.error);
        const { socialLinkIndex, socialLinkField } = result.socialLinks;
        if (socialLinkIndex !== undefined && socialLinkField) {
          setSocialLinkErrors({ [socialLinkIndex]: { [socialLinkField]: true } });
        }
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

  function addSocialLink() {
    setSocialLinksInput((prev) => [...prev, { name: "", url: "" }]);
    setSocialLinksStatus("idle");
    setSocialLinksError(null);
  }

  function removeSocialLink(index: number) {
    setSocialLinksInput((prev) => prev.filter((_, i) => i !== index));
    setSocialLinksStatus("idle");
    setSocialLinksError(null);
    setSocialLinkErrors({});
  }

  function updateSocialLink(index: number, field: "name" | "url", value: string) {
    setSocialLinksInput((prev) =>
      prev.map((link, i) => (i === index ? { ...link, [field]: value } : link))
    );
    setSocialLinksStatus("idle");
    setSocialLinksError(null);
    setSocialLinkErrors((prev) => {
      if (!prev[index]?.[field]) return prev;
      const updated = { ...prev[index], [field]: false };
      return { ...prev, [index]: updated };
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

      {/* Marketplace Panel */}
      <div className="bg-card border border-border rounded-xl p-6">
        <h2 className="text-lg font-semibold text-foreground mb-4">Marketplace</h2>
        <form onSubmit={handleMarketplaceSubmit} className="space-y-5">
          {/* Currency */}
          <div className="space-y-2">
            <Label htmlFor="currency" className="text-foreground">
              Currency
            </Label>
            <input
              id="currency"
              type="text"
              maxLength={3}
              value={currencyInput}
              onChange={(e) => {
                setCurrencyInput(e.target.value.toUpperCase());
                setCurrencyStatus("idle");
                setCurrencyError(null);
              }}
              className={`w-full ${getInputClass(currencyStatus)}`}
            />
            {currencyError && <p className="text-xs text-red-400">{currencyError}</p>}
            <p className="text-xs text-muted-foreground">
              3-letter currency denomination (e.g. USD, SGD, RMB) shown next to all prices in the app.
            </p>
          </div>

          {/* Phone Number */}
          <div className="space-y-2">
            <Label htmlFor="phone_number" className="text-foreground">
              Phone Number
            </Label>
            <input
              id="phone_number"
              type="tel"
              maxLength={32}
              value={phoneInput}
              onChange={(e) => {
                setPhoneInput(e.target.value);
                setPhoneStatus("idle");
                setPhoneError(null);
              }}
              className={`w-full ${getInputClass(phoneStatus)}`}
            />
            {phoneError && <p className="text-xs text-red-400">{phoneError}</p>}
            <p className="text-xs text-muted-foreground">
              Optional. Displayed to buyers in the Contact Seller section.
            </p>
          </div>

          {/* Email Address */}
          <div className="space-y-2">
            <Label htmlFor="email_address" className="text-foreground">
              Email Address
            </Label>
            <input
              id="email_address"
              type="email"
              maxLength={256}
              value={emailInput}
              onChange={(e) => {
                setEmailInput(e.target.value);
                setEmailStatus("idle");
                setEmailError(null);
              }}
              className={`w-full ${getInputClass(emailStatus)}`}
            />
            {emailError && <p className="text-xs text-red-400">{emailError}</p>}
            <p className="text-xs text-muted-foreground">
              Optional. Displayed to buyers in the Contact Seller section.
            </p>
          </div>

          {/* Social Media Links */}
          <div className="space-y-2">
            <Label className="text-foreground">Social Media Links</Label>
            <div className={`space-y-2 ${
              socialLinksStatus === "success" && Object.keys(socialLinkErrors).length === 0
                ? "rounded-md ring-2 ring-green-500 p-1"
                : socialLinksStatus === "error" && Object.keys(socialLinkErrors).length === 0
                ? "rounded-md ring-2 ring-red-500 p-1"
                : ""
            }`}>
              {socialLinksInput.map((link, index) => (
                <div key={index} className="flex gap-2 items-center">
                  <input
                    type="text"
                    placeholder="Name"
                    value={link.name}
                    maxLength={64}
                    onChange={(e) => updateSocialLink(index, "name", e.target.value)}
                    className={`flex-1 ${getInputClass(socialLinkErrors[index]?.name ? "error" : "idle")}`}
                  />
                  <input
                    type="text"
                    placeholder="URL"
                    value={link.url}
                    maxLength={512}
                    onChange={(e) => updateSocialLink(index, "url", e.target.value)}
                    className={`flex-[2] ${getInputClass(socialLinkErrors[index]?.url ? "error" : "idle")}`}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 text-muted-foreground hover:text-foreground shrink-0"
                    onClick={() => removeSocialLink(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
            {socialLinksError && <p className="text-xs text-red-400">{socialLinksError}</p>}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 text-xs text-muted-foreground hover:text-foreground gap-1 px-2 pl-1"
              onClick={addSocialLink}
            >
              <Plus className="h-3 w-3" />
              Add social link
            </Button>
          </div>

          <Button type="submit" disabled={isPendingMarketplace}>
            {isPendingMarketplace ? "Saving..." : "Save Marketplace Settings"}
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
