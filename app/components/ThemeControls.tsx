"use client";

import { useSyncExternalStore } from "react";

const themeStorageKey = "exerciseinsight-theme";
const accentStorageKey = "exerciseinsight-accent";

const accentOptions = [
  { name: "Blue", value: "#2563eb" },
  { name: "Teal", value: "#0f766e" },
  { name: "Green", value: "#16a34a" },
  { name: "Pink", value: "#db2777" },
  { name: "Rose", value: "#e11d48" },
  { name: "Orange", value: "#ea580c" },
  { name: "Yellow", value: "#ca8a04" },
  { name: "Red", value: "#dc2626" },
  { name: "Purple", value: "#7c3aed" },
  { name: "Indigo", value: "#4f46e5" },
  { name: "Cyan", value: "#0891b2" },
];

function applyTheme(theme: string, accent: string) {
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.setProperty("--accent", accent);
}

function subscribeToThemeChanges(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener("exerciseinsight-theme-change", callback);

  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener("exerciseinsight-theme-change", callback);
  };
}

function getThemeSnapshot() {
  return localStorage.getItem(themeStorageKey) ?? "dark";
}

function getAccentSnapshot() {
  return localStorage.getItem(accentStorageKey) ?? accentOptions[0].value;
}

function getServerThemeSnapshot() {
  return "dark";
}

function getServerAccentSnapshot() {
  return accentOptions[0].value;
}

function notifyThemeChanged() {
  window.dispatchEvent(new Event("exerciseinsight-theme-change"));
}

type ThemeControlsProps = {
  layout?: "compact" | "panel";
};

export function ThemeControls({ layout = "compact" }: ThemeControlsProps) {
  const theme = useSyncExternalStore(
    subscribeToThemeChanges,
    getThemeSnapshot,
    getServerThemeSnapshot
  );
  const accent = useSyncExternalStore(
    subscribeToThemeChanges,
    getAccentSnapshot,
    getServerAccentSnapshot
  );

  function updateTheme(nextTheme: string) {
    localStorage.setItem(themeStorageKey, nextTheme);
    applyTheme(nextTheme, accent);
    notifyThemeChanged();
  }

  function updateAccent(nextAccent: string) {
    localStorage.setItem(accentStorageKey, nextAccent);
    applyTheme(theme, nextAccent);
    notifyThemeChanged();
  }

  const wrapperClass =
    layout === "panel"
      ? "grid gap-4 rounded-lg border border-gray-800 bg-gray-950 p-4"
      : "flex items-center gap-2 rounded-md bg-white/5 p-1";
  const selectClass =
    "w-full rounded-md border border-white/10 bg-gray-950 px-3 py-3 text-sm font-semibold text-white";

  return (
    <div className={wrapperClass}>
      <div className={layout === "panel" ? "grid gap-4 sm:grid-cols-2" : "contents"}>
        <label htmlFor="theme-mode" className="sr-only">
          Theme mode
        </label>
        <select
          id="theme-mode"
          name="theme-mode"
          className={selectClass}
          value={theme}
          onChange={(event) => updateTheme(event.target.value)}
        >
          <option value="dark">Dark</option>
          <option value="light">Light</option>
        </select>

        <label htmlFor="accent-color" className="sr-only">
          Accent color
        </label>
        <select
          id="accent-color"
          name="accent-color"
          className={selectClass}
          value={accent}
          onChange={(event) => updateAccent(event.target.value)}
        >
          {accentOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.name}
            </option>
          ))}
        </select>
      </div>

      {layout === "panel" && (
        <div>
          <p className="mb-3 text-sm font-semibold text-gray-300">Accent Preview</p>
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
            {accentOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => updateAccent(option.value)}
                className={`flex h-12 items-center justify-center rounded-md border text-xs font-semibold ${
                  accent === option.value
                    ? "border-white/80 text-white"
                    : "border-white/10 text-white/80"
                }`}
                style={{
                  background:
                    accent === option.value
                      ? `linear-gradient(135deg, ${option.value}, color-mix(in srgb, ${option.value} 70%, black))`
                      : option.value,
                  boxShadow:
                    accent === option.value
                      ? `0 10px 22px color-mix(in srgb, ${option.value} 35%, transparent)`
                      : "none",
                }}
                aria-label={"Use " + option.name + " accent"}
              >
                {option.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
