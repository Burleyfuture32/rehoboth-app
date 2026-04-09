"use client";

import Link from "next/link";
import {
  PointerEvent as ReactPointerEvent,
  ReactNode,
  useEffect,
  useRef,
  useState,
} from "react";

type ShortcutOption = {
  id: string;
  label: string;
  description: string;
  href: string;
  icon: ReactNode;
};

type WidgetPosition = {
  x: number;
  y: number;
};

type DragState = {
  moved: boolean;
  originX: number;
  originY: number;
  startX: number;
  startY: number;
};

const shortcutOptions: ShortcutOption[] = [
  {
    id: "new-lead",
    label: "New lead",
    description: "Start intake",
    href: "/leads/intake",
    icon: (
      <svg aria-hidden="true" fill="none" viewBox="0 0 24 24">
        <path
          d="M12 5V19M5 12H19"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.7"
        />
      </svg>
    ),
  },
  {
    id: "search",
    label: "Search",
    description: "Find anything",
    href: "/search",
    icon: (
      <svg aria-hidden="true" fill="none" viewBox="0 0 24 24">
        <path
          d="M11 18.25A7.25 7.25 0 1 0 11 3.75A7.25 7.25 0 0 0 11 18.25ZM16.25 16.25L20.25 20.25"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.6"
        />
      </svg>
    ),
  },
  {
    id: "pipeline",
    label: "Pipeline",
    description: "Move files",
    href: "/pipeline",
    icon: (
      <svg aria-hidden="true" fill="none" viewBox="0 0 24 24">
        <path
          d="M4.75 7.25H10.25V16.75H4.75V7.25ZM13.75 4.75H19.25V10.25H13.75V4.75ZM13.75 13.75H19.25V19.25H13.75V13.75Z"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.5"
        />
      </svg>
    ),
  },
  {
    id: "clients",
    label: "Clients",
    description: "Open roster",
    href: "/clients",
    icon: (
      <svg aria-hidden="true" fill="none" viewBox="0 0 24 24">
        <path
          d="M8.25 10.25A2.75 2.75 0 1 0 8.25 4.75A2.75 2.75 0 0 0 8.25 10.25ZM15.75 12.25A2.5 2.5 0 1 0 15.75 7.25A2.5 2.5 0 0 0 15.75 12.25ZM4.75 18.75C4.75 16.26 6.76 14.25 9.25 14.25H11.25C13.74 14.25 15.75 16.26 15.75 18.75M14.25 18.75C14.25 17.06 15.61 15.75 17.25 15.75H17.5C19.16 15.75 20.5 17.09 20.5 18.75"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.45"
        />
      </svg>
    ),
  },
  {
    id: "tasks",
    label: "Tasks",
    description: "Follow-ups due",
    href: "/tasks",
    icon: (
      <svg aria-hidden="true" fill="none" viewBox="0 0 24 24">
        <path
          d="M7.5 7.75H18.5M7.5 12H18.5M7.5 16.25H18.5M4.75 7.75H4.76M4.75 12H4.76M4.75 16.25H4.76"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.7"
        />
      </svg>
    ),
  },
  {
    id: "workflows",
    label: "Workflows",
    description: "Launch steps",
    href: "/workflows",
    icon: (
      <svg aria-hidden="true" fill="none" viewBox="0 0 24 24">
        <path
          d="M6.25 5.75H10.25V9.75H6.25V5.75ZM13.75 5.75H17.75V9.75H13.75V5.75ZM10.25 7.75H13.75M8.25 9.75V14.25H15.75V9.75M6.25 14.25H10.25V18.25H6.25V14.25ZM13.75 14.25H17.75V18.25H13.75V14.25Z"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.5"
        />
      </svg>
    ),
  },
  {
    id: "documents",
    label: "Documents",
    description: "Request or upload",
    href: "/documents",
    icon: (
      <svg aria-hidden="true" fill="none" viewBox="0 0 24 24">
        <path
          d="M8 4.75H13.5L18.25 9.5V19.25H8V4.75ZM13.25 4.75V9.75H18.25M10.25 13H15.75M10.25 16.25H15.75"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.5"
        />
      </svg>
    ),
  },
  {
    id: "capital-sources",
    label: "Lenders",
    description: "Capital desk",
    href: "/capital-sources",
    icon: (
      <svg aria-hidden="true" fill="none" viewBox="0 0 24 24">
        <path
          d="M6.75 8.25H17.25M6.75 12H17.25M6.75 15.75H13.25M8.5 5.25V18.75M15.5 5.25V18.75"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.5"
        />
      </svg>
    ),
  },
  {
    id: "ratesheets",
    label: "Ratesheets",
    description: "View pricing",
    href: "/ratesheets",
    icon: (
      <svg aria-hidden="true" fill="none" viewBox="0 0 24 24">
        <path
          d="M5.75 18.25L9.25 13.75L12 15.75L17.75 7.75M14.25 7.75H17.75V11.25"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.7"
        />
      </svg>
    ),
  },
  {
    id: "scenarios",
    label: "Scenarios",
    description: "Run comparisons",
    href: "/scenarios",
    icon: (
      <svg aria-hidden="true" fill="none" viewBox="0 0 24 24">
        <path
          d="M5.75 6.75H10.25V11.25H5.75V6.75ZM13.75 6.75H18.25V11.25H13.75V6.75ZM5.75 13.75H10.25V18.25H5.75V13.75ZM12 9H13.75M10.25 16H13M15.25 16H18.25"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.5"
        />
      </svg>
    ),
  },
  {
    id: "reports",
    label: "Reports",
    description: "See rollups",
    href: "/reports",
    icon: (
      <svg aria-hidden="true" fill="none" viewBox="0 0 24 24">
        <path
          d="M5.75 18.25V12.25M12 18.25V5.75M18.25 18.25V9.25"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.7"
        />
      </svg>
    ),
  },
];

const defaultShortcutIds = ["new-lead", "search", "pipeline", "documents"];
const shortcutsStorageKey = "rehoboth.quick-tools.v1";
const collapsedStorageKey = "rehoboth.quick-tools.collapsed.v1";
const positionStorageKey = "rehoboth.quick-tools.position.v1";
const viewportPadding = 16;

function loadStoredShortcutIds() {
  if (typeof window === "undefined") {
    return defaultShortcutIds;
  }

  try {
    const storedShortcuts = window.localStorage.getItem(shortcutsStorageKey);

    if (!storedShortcuts) {
      return defaultShortcutIds;
    }

    const parsed = JSON.parse(storedShortcuts);

    if (
      Array.isArray(parsed) &&
      parsed.length === 4 &&
      parsed.every((value) =>
        shortcutOptions.some((shortcut) => shortcut.id === value),
      )
    ) {
      return parsed;
    }
  } catch {}

  return defaultShortcutIds;
}

function loadStoredCollapsedState() {
  if (typeof window === "undefined") {
    return true;
  }

  try {
    return window.localStorage.getItem(collapsedStorageKey) !== "false";
  } catch {
    return true;
  }
}

function loadStoredPosition() {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const storedPosition = window.localStorage.getItem(positionStorageKey);

    if (!storedPosition) {
      return null;
    }

    const parsedPosition = JSON.parse(storedPosition);

    if (
      typeof parsedPosition?.x === "number" &&
      typeof parsedPosition?.y === "number"
    ) {
      return parsedPosition satisfies WidgetPosition;
    }
  } catch {}

  return null;
}

function clampPosition(
  position: WidgetPosition,
  width: number,
  height: number,
): WidgetPosition {
  const maxX = Math.max(viewportPadding, window.innerWidth - width - viewportPadding);
  const maxY = Math.max(
    viewportPadding,
    window.innerHeight - height - viewportPadding,
  );

  return {
    x: Math.min(Math.max(viewportPadding, position.x), maxX),
    y: Math.min(Math.max(viewportPadding, position.y), maxY),
  };
}

function getDefaultPosition(width: number, height: number): WidgetPosition {
  return clampPosition(
    {
      x: window.innerWidth - width - 28,
      y: window.innerHeight - height - 28,
    },
    width,
    height,
  );
}

const quadrantStyles = [
  "rounded-tl-full border-r border-b border-white/10",
  "rounded-tr-full border-l border-b border-white/10",
  "rounded-bl-full border-r border-t border-white/10",
  "rounded-br-full border-l border-t border-white/10",
] as const;

export function QuickToolsWidget() {
  const widgetRef = useRef<HTMLDivElement | null>(null);
  const dragStateRef = useRef<DragState | null>(null);
  const suppressToggleRef = useRef(false);

  const [shortcutIds, setShortcutIds] = useState(loadStoredShortcutIds);
  const [customizing, setCustomizing] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(loadStoredCollapsedState);
  const [position, setPosition] = useState<WidgetPosition | null>(loadStoredPosition);

  useEffect(() => {
    window.localStorage.setItem(
      shortcutsStorageKey,
      JSON.stringify(shortcutIds),
    );
  }, [shortcutIds]);

  useEffect(() => {
    window.localStorage.setItem(collapsedStorageKey, String(isCollapsed));
  }, [isCollapsed]);

  useEffect(() => {
    if (!position) {
      return;
    }

    window.localStorage.setItem(positionStorageKey, JSON.stringify(position));
  }, [position]);

  useEffect(() => {
    function syncPositionToViewport() {
      if (!widgetRef.current) {
        return;
      }

      const rect = widgetRef.current.getBoundingClientRect();

      setPosition((current) =>
        clampPosition(
          current ?? getDefaultPosition(rect.width, rect.height),
          rect.width,
          rect.height,
        ),
      );
    }

    const frame = window.requestAnimationFrame(syncPositionToViewport);
    window.addEventListener("resize", syncPositionToViewport);

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", syncPositionToViewport);
    };
  }, [customizing, isCollapsed]);

  useEffect(() => {
    return () => {
      window.onpointermove = null;
      window.onpointerup = null;
    };
  }, []);

  function updateShortcut(slotIndex: number, nextShortcutId: string) {
    setShortcutIds((current) => {
      const next = [...current];
      const existingIndex = next.findIndex((value) => value === nextShortcutId);

      if (existingIndex >= 0 && existingIndex !== slotIndex) {
        const currentValue = next[slotIndex];
        next[slotIndex] = nextShortcutId;
        next[existingIndex] = currentValue;
        return next;
      }

      next[slotIndex] = nextShortcutId;
      return next;
    });
  }

  function resetDefaults() {
    setShortcutIds(defaultShortcutIds);
  }

  function stopDragging() {
    window.onpointermove = null;
    window.onpointerup = null;
    dragStateRef.current = null;
  }

  function startDragging(event: ReactPointerEvent<HTMLElement>) {
    if (!widgetRef.current) {
      return;
    }

    event.preventDefault();

    const rect = widgetRef.current.getBoundingClientRect();
    const origin = position ?? { x: rect.left, y: rect.top };

    dragStateRef.current = {
      moved: false,
      originX: origin.x,
      originY: origin.y,
      startX: event.clientX,
      startY: event.clientY,
    };

    window.onpointermove = (moveEvent) => {
      if (!dragStateRef.current || !widgetRef.current) {
        return;
      }

      const dx = moveEvent.clientX - dragStateRef.current.startX;
      const dy = moveEvent.clientY - dragStateRef.current.startY;

      if (Math.abs(dx) > 4 || Math.abs(dy) > 4) {
        dragStateRef.current.moved = true;
      }

      setPosition(
        clampPosition(
          {
            x: dragStateRef.current.originX + dx,
            y: dragStateRef.current.originY + dy,
          },
          widgetRef.current.offsetWidth,
          widgetRef.current.offsetHeight,
        ),
      );
    };

    window.onpointerup = () => {
      if (dragStateRef.current?.moved) {
        suppressToggleRef.current = true;
        window.setTimeout(() => {
          suppressToggleRef.current = false;
        }, 0);
      }

      stopDragging();
    };
  }

  const selectedShortcuts = shortcutIds
    .map((shortcutId) =>
      shortcutOptions.find((shortcut) => shortcut.id === shortcutId),
    )
    .filter((shortcut): shortcut is ShortcutOption => Boolean(shortcut));

  const containerStyle =
    position === null
      ? { right: 28, bottom: 28 }
      : { left: position.x, top: position.y };

  return (
    <div className="fixed z-30" ref={widgetRef} style={containerStyle}>
      {isCollapsed ? (
        <button
          aria-label="Open quick tools widget"
          className="pointer-events-auto flex h-[76px] w-[76px] items-center justify-center rounded-full border border-slate-200/60 bg-[radial-gradient(circle_at_50%_40%,rgba(255,255,255,0.95),rgba(255,255,255,0.84)_18%,rgba(31,143,47,0.92)_38%,rgba(19,28,21,0.98)_72%,rgba(8,11,9,1)_100%)] text-white shadow-[0_28px_80px_rgba(16,24,18,0.28)] transition hover:scale-[1.02]"
          onClick={() => {
            if (suppressToggleRef.current) {
              return;
            }

            setIsCollapsed(false);
          }}
          onPointerDown={startDragging}
          type="button"
        >
          <span className="flex flex-col items-center gap-1">
            <span className="grid grid-cols-2 gap-1">
              <span className="h-2.5 w-2.5 rounded-full bg-white" />
              <span className="h-2.5 w-2.5 rounded-full bg-white/88" />
              <span className="h-2.5 w-2.5 rounded-full bg-white/88" />
              <span className="h-2.5 w-2.5 rounded-full bg-white" />
            </span>
            <span className="text-[10px] font-semibold uppercase tracking-[0.18em]">
              Tools
            </span>
          </span>
        </button>
      ) : (
        <section className="pointer-events-auto w-[290px]">
          <div className="relative mx-auto h-[248px] w-[248px]">
            <div className="absolute inset-0 rounded-full bg-[linear-gradient(180deg,#0d110f_0%,#20241f_100%)] p-3 shadow-[0_28px_80px_rgba(16,24,18,0.3)]">
              <div className="grid h-full w-full grid-cols-2 grid-rows-2 gap-0 overflow-hidden rounded-full border border-white/8 bg-black/50">
                {selectedShortcuts.map((shortcut, index) => (
                  <Link
                    key={shortcut.id}
                    className={`group flex flex-col items-center justify-center gap-2 bg-[linear-gradient(180deg,rgba(52,56,61,0.94),rgba(25,28,31,0.98))] px-5 py-6 text-center text-white transition hover:bg-[linear-gradient(180deg,rgba(31,143,47,0.92),rgba(17,110,37,0.98))] ${quadrantStyles[index]}`}
                    href={shortcut.href}
                  >
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/92 transition group-hover:bg-white/12 [&_svg]:h-5 [&_svg]:w-5">
                      {shortcut.icon}
                    </span>
                    <span className="text-[12px] font-semibold leading-4">
                      {shortcut.label}
                    </span>
                    <span className="text-[10px] uppercase tracking-[0.14em] text-white/55 group-hover:text-white/78">
                      {shortcut.description}
                    </span>
                  </Link>
                ))}
              </div>
            </div>

            <button
              className="absolute left-1/2 top-1/2 flex h-[88px] w-[88px] -translate-x-1/2 -translate-y-1/2 cursor-grab flex-col items-center justify-center rounded-full border border-white/20 bg-[radial-gradient(circle_at_50%_38%,rgba(255,255,255,1),rgba(255,255,255,0.92)_18%,rgba(188,255,217,0.88)_28%,rgba(117,197,255,0.92)_45%,rgba(90,55,144,0.92)_70%,rgba(20,18,32,0.98)_100%)] text-slate-950 shadow-[0_20px_45px_rgba(0,0,0,0.35)] active:cursor-grabbing"
              onPointerDown={startDragging}
              type="button"
            >
              <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-900/70">
                Drag
              </span>
              <span className="mt-1 text-[12px] font-semibold text-slate-950">
                Rehoboth
              </span>
            </button>
          </div>

          <div className="mt-3 flex justify-center gap-2">
            <button
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-[0_12px_30px_rgba(16,24,18,0.08)] transition hover:border-slate-300 hover:bg-slate-100"
              onClick={() => setCustomizing((current) => !current)}
              type="button"
            >
              {customizing ? "Done editing" : "Edit layout"}
            </button>
            <button
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-[0_12px_30px_rgba(16,24,18,0.08)] transition hover:border-slate-300 hover:bg-slate-100"
              onClick={() => {
                setCustomizing(false);
                setIsCollapsed(true);
              }}
              type="button"
            >
              Collapse
            </button>
          </div>

          {customizing ? (
            <div className="mt-3 rounded-[24px] border border-[color:var(--border-soft)] bg-[color:var(--surface)]/96 p-4 shadow-[0_24px_60px_rgba(16,24,18,0.18)] backdrop-blur">
              <div className="mb-4 rounded-[18px] border border-dashed border-slate-200 bg-slate-50/80 px-4 py-3 text-xs leading-5 text-slate-600">
                Edit the wheel directly here. Each segment stays unique, and choosing a
                tool already in use will swap the two positions.
              </div>

              <div className="space-y-3">
                {shortcutIds.map((shortcutId, slotIndex) => (
                  <label key={`slot-${slotIndex}`} className="block">
                    <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                      Segment {slotIndex + 1}
                    </span>
                    <select
                      className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-400"
                      onChange={(event) => updateShortcut(slotIndex, event.target.value)}
                      value={shortcutId}
                    >
                      {shortcutOptions.map((shortcut) => (
                        <option key={shortcut.id} value={shortcut.id}>
                          {shortcut.label} | {shortcut.description}
                        </option>
                      ))}
                    </select>
                  </label>
                ))}
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  className="inline-flex items-center rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-100"
                  onClick={resetDefaults}
                  type="button"
                >
                  Reset defaults
                </button>
                <button
                  className="inline-flex items-center rounded-full bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-700"
                  onClick={() => setCustomizing(false)}
                  type="button"
                >
                  Save layout
                </button>
              </div>
            </div>
          ) : null}
        </section>
      )}
    </div>
  );
}
