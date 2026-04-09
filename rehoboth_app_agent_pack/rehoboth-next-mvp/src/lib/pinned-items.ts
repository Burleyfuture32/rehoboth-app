export type PinCategory =
  | "SCREEN"
  | "CLIENT"
  | "FILE"
  | "TRACKER"
  | "WORKFLOW"
  | "QUEUE"
  | "CUSTOM";

export type PinnedItem = {
  id: string;
  label: string;
  href: string;
  category: PinCategory;
  note?: string;
};

export const pinnedItemsStorageKey = "rehoboth.client-rail.pins.v1";
export const pinnedItemsStorageEvent = "rehoboth.client-rail.pins.updated";
export const maxPinnedItems = 10;

export const defaultPinnedItems: PinnedItem[] = [
  {
    id: "pin-bulk-actions",
    label: "Bulk Actions",
    href: "/bulk-actions",
    category: "QUEUE",
    note: "Grouped file work",
  },
  {
    id: "pin-workflows",
    label: "Workflow Launcher",
    href: "/workflows",
    category: "WORKFLOW",
    note: "Launch repeat steps",
  },
  {
    id: "pin-knowledge-base",
    label: "Knowledge Base",
    href: "/knowledge-base",
    category: "SCREEN",
    note: "Reference answers",
  },
];

export function normalizePinHref(value: string) {
  const trimmed = value.trim();

  if (!trimmed) {
    return "";
  }

  if (trimmed.startsWith("/")) {
    return trimmed;
  }

  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }

  return `/${trimmed.replace(/^\/+/, "")}`;
}

export function readStoredPins() {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const storedPins = window.localStorage.getItem(pinnedItemsStorageKey);

    if (!storedPins) {
      return [];
    }

    const parsed = JSON.parse(storedPins);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .filter((item): item is PinnedItem => {
        return (
          typeof item?.id === "string" &&
          typeof item?.label === "string" &&
          typeof item?.href === "string" &&
          typeof item?.category === "string"
        );
      })
      .slice(0, maxPinnedItems);
  } catch {
    return [];
  }
}

export function writeStoredPins(items: PinnedItem[], notify = true) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(
      pinnedItemsStorageKey,
      JSON.stringify(items.slice(0, maxPinnedItems)),
    );
    if (notify) {
      window.dispatchEvent(new Event(pinnedItemsStorageEvent));
    }
  } catch {}
}

export function upsertStoredPin(nextItem: PinnedItem) {
  const existing = readStoredPins().filter(
    (item) =>
      item.href !== nextItem.href &&
      item.label.toLowerCase() !== nextItem.label.toLowerCase(),
  );

  const nextItems = [nextItem, ...existing];
  writeStoredPins(nextItems, true);
  return nextItems.slice(0, maxPinnedItems);
}
