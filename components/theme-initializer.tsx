"use client";

import { useEffect } from "react";
import { useTheme } from "next-themes";

export function ThemeInitializer({ userTheme }: { userTheme: string }) {
  const { setTheme } = useTheme();

  useEffect(() => {
    if (userTheme === "system") {
      setTheme("system");
    } else if (userTheme === "time" || userTheme === "clock") {
      const hour = new Date().getHours();
      setTheme(hour >= 7 && hour < 19 ? "light" : "dark");
    } else if (userTheme === "light" || userTheme === "dark") {
      setTheme(userTheme);
    } else {
      setTheme("dark");
    }
  }, [userTheme, setTheme]);

  return null;
}
