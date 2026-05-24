"use client";

import { useEffect } from "react";

const themeStorageKey = "exerciseinsight-theme";
const accentStorageKey = "exerciseinsight-accent";

export function ThemeInitializer() {
  useEffect(() => {
    const theme = localStorage.getItem(themeStorageKey) ?? "dark";
    const accent = localStorage.getItem(accentStorageKey) ?? "#2563eb";

    document.documentElement.dataset.theme = theme;
    document.documentElement.style.setProperty("--accent", accent);
  }, []);

  return null;
}
