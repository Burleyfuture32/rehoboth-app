"use client";

import { useSyncExternalStore } from "react";
import {
  readStoredTheme,
  subscribeStoredTheme,
  writeStoredTheme,
} from "@/lib/theme";

export function ThemeToggleButton({
  className,
  compact = false,
}: {
  className?: string;
  compact?: boolean;
}) {
  const theme = useSyncExternalStore(
    subscribeStoredTheme,
    readStoredTheme,
    () => "light",
  );
  const nextTheme = theme === "dark" ? "light" : "dark";

  return (
    <button
      aria-label={`Switch to ${nextTheme} mode`}
      className={`inline-flex items-center justify-center gap-2 rounded-full border border-[color:var(--app-toggle-border)] bg-[color:var(--app-toggle-bg)] px-4 py-2.5 text-sm font-medium text-[color:var(--app-toggle-text)] shadow-[var(--secondary-button-shadow)] transition hover:border-[color:var(--app-toggle-hover-border)] hover:bg-[color:var(--app-toggle-hover-bg)] ${className ?? ""}`}
      onClick={() => writeStoredTheme(nextTheme)}
      title={`Switch to ${nextTheme} mode`}
      type="button"
    >
      <span className="relative inline-flex h-5 w-5 shrink-0 items-center justify-center">
        {theme === "dark" ? (
          <svg aria-hidden="true" fill="none" viewBox="0 0 24 24">
            <path
              d="M12 3.75V5.75M12 18.25V20.25M6.17 6.17L7.59 7.59M16.41 16.41L17.83 17.83M3.75 12H5.75M18.25 12H20.25M6.17 17.83L7.59 16.41M16.41 7.59L17.83 6.17M15.75 12A3.75 3.75 0 1 1 8.25 12A3.75 3.75 0 0 1 15.75 12Z"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.6"
            />
          </svg>
        ) : (
          <svg aria-hidden="true" fill="none" viewBox="0 0 24 24">
            <path
              d="M19.25 13.17A7.25 7.25 0 0 1 10.83 4.75A7.25 7.25 0 1 0 19.25 13.17Z"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.6"
            />
          </svg>
        )}
      </span>
      {compact ? null : (
        <span className="hidden sm:inline">
          {theme === "dark" ? "Light mode" : "Dark mode"}
        </span>
      )}
    </button>
  );
}
