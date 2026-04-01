"use client";

import { useEffect } from "react";

export function ThemeSync({ userTheme }: { userTheme: string }) {
  useEffect(() => {
    const resolved =
      userTheme === "clock"
        ? (() => {
            const hour = new Date().getHours();
            return hour >= 7 && hour < 19 ? "light" : "dark";
          })()
        : userTheme === "light"
          ? "light"
          : "dark";

    document.documentElement.setAttribute("data-theme", resolved);
    document.cookie = `theme-resolved=${resolved};path=/;max-age=${60 * 60 * 24 * 365};SameSite=Lax`;
  }, [userTheme]);

  return null;
}
