"use client";

import { useState } from "react";
import { PinnedItem, upsertStoredPin } from "@/lib/pinned-items";

export function PinToQuickManagerButton({
  item,
  size = "sm",
}: {
  item: PinnedItem;
  size?: "xs" | "sm";
}) {
  const [status, setStatus] = useState<"idle" | "pinned">("idle");
  const label = status === "pinned" ? `${item.label} pinned` : `Pin ${item.label}`;

  return (
    <button
      aria-label={label}
      className={`inline-flex items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-800 ${
        size === "xs" ? "h-8 w-8" : "h-10 w-10"
      }`}
      onClick={() => {
        upsertStoredPin(item);
        setStatus("pinned");
      }}
      title={label}
      type="button"
    >
      <span className="sr-only">{label}</span>
      {status === "pinned" ? (
        <svg aria-hidden="true" className="h-4 w-4 text-emerald-700" fill="none" viewBox="0 0 24 24">
          <path
            d="M6.75 12.75L10.25 16.25L17.25 8.75"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.8"
          />
        </svg>
      ) : (
        <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
          <path
            d="M8.5 4.75H15.5L17.75 10.25L13.5 12.75V18.25L10.5 16.25V12.75L6.25 10.25L8.5 4.75Z"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.6"
          />
        </svg>
      )}
    </button>
  );
}
