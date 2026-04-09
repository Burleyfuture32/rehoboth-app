"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode, Suspense, useState, useSyncExternalStore } from "react";
import { ClientQuickAccessToolbar } from "@/components/client-quick-access-toolbar";
import { QuickToolsWidget } from "@/components/quick-tools-widget";
import { RehobothExpert } from "@/components/rehoboth-expert";
import { ThemeToggleButton } from "@/components/theme-toggle";

const clientRailStorageKey = "rehoboth.client-rail.compact.v1";
const clientRailStorageEvent = "rehoboth-client-rail-storage";

const navigationItems = [
  {
    href: "/",
    label: "Dashboard",
    icon: (
      <svg aria-hidden="true" fill="none" viewBox="0 0 24 24">
        <path
          d="M4.75 4.75H10.25V10.25H4.75V4.75ZM13.75 4.75H19.25V13.25H13.75V4.75ZM4.75 13.75H10.25V19.25H4.75V13.75ZM13.75 16.75H19.25V19.25H13.75V16.75Z"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.5"
        />
      </svg>
    ),
  },
  {
    href: "/leads/intake",
    label: "Lead Intake",
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
    href: "/pipeline",
    label: "Pipeline Board",
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
    href: "/tasks",
    label: "Task Center",
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
    href: "/workflows",
    label: "Workflows",
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
    href: "/knowledge-base",
    label: "Knowledge Base",
    icon: (
      <svg aria-hidden="true" fill="none" viewBox="0 0 24 24">
        <path
          d="M6.75 5.75H17.25C18.3546 5.75 19.25 6.64543 19.25 7.75V17.25C19.25 18.3546 18.3546 19.25 17.25 19.25H6.75C5.64543 19.25 4.75 18.3546 4.75 17.25V7.75C4.75 6.64543 5.64543 5.75 6.75 5.75ZM8 9H16M8 12H16M8 15H12.5"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.5"
        />
      </svg>
    ),
  },
  {
    href: "/bulk-actions",
    label: "Bulk Actions",
    icon: (
      <svg aria-hidden="true" fill="none" viewBox="0 0 24 24">
        <path
          d="M5.75 6.75H12.25V11.75H5.75V6.75ZM14.25 6.75H18.25V10.75H14.25V6.75ZM5.75 13.25H9.75V17.25H5.75V13.25ZM11.75 14.75H18.25M13.75 17.25H18.25"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.5"
        />
      </svg>
    ),
  },
  {
    href: "/documents",
    label: "Documents",
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
    href: "/capital-sources",
    label: "Capital Sources",
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
    href: "/lender-portal",
    label: "Lender Portal",
    icon: (
      <svg aria-hidden="true" fill="none" viewBox="0 0 24 24">
        <path
          d="M5.75 19.25H18.25M7.25 19.25V8.25M12 19.25V8.25M16.75 19.25V8.25M4.75 8.25H19.25L12 4.75L4.75 8.25ZM8.75 11.25H10.75M13.25 11.25H15.25"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.5"
        />
      </svg>
    ),
  },
  {
    href: "/scenarios",
    label: "Scenarios Desk",
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
    href: "/ratesheets",
    label: "Ratesheets",
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
    href: "/reports",
    label: "Reports",
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
] as const;

function useStoredBoolean(key: string) {
  const value = useSyncExternalStore(
    subscribeStoredBoolean,
    () => readStoredBoolean(key),
    () => false,
  );

  return [
    value,
    (nextValue: boolean) => writeStoredBoolean(key, nextValue),
  ] as const;
}

function subscribeStoredBoolean(callback: () => void) {
  if (typeof window === "undefined") {
    return () => {};
  }

  const handleChange = () => callback();
  window.addEventListener("storage", handleChange);
  window.addEventListener(clientRailStorageEvent, handleChange);

  return () => {
    window.removeEventListener("storage", handleChange);
    window.removeEventListener(clientRailStorageEvent, handleChange);
  };
}

function readStoredBoolean(key: string) {
  if (typeof window === "undefined") {
    return false;
  }

  try {
    return window.localStorage.getItem(key) === "true";
  } catch {
    return false;
  }
}

function writeStoredBoolean(key: string, value: boolean) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(key, String(value));
    window.dispatchEvent(new Event(clientRailStorageEvent));
  } catch {}
}

export function AppFrame({ children }: { children: ReactNode }) {
  const [sidebarCompact, setSidebarCompact] = useState(false);
  const [clientRailCompact, setClientRailCompact] =
    useStoredBoolean(clientRailStorageKey);

  return (
    <div className="min-h-screen overflow-x-hidden text-[color:var(--foreground)] [background:var(--app-shell-bg)]">
      <div
        className={`mx-auto grid min-h-screen max-w-[1440px] grid-cols-1 transition-[grid-template-columns] duration-300 ${
          sidebarCompact
            ? "lg:grid-cols-[88px_minmax(0,1fr)]"
            : "lg:grid-cols-[250px_minmax(0,1fr)]"
        }`}
      >
        <aside
          id="rehoboth-sidebar"
          className={`fixed inset-y-0 left-0 z-30 overflow-hidden border-r border-white/10 text-white shadow-[0_24px_60px_rgba(0,0,0,0.32)] transition-[width] duration-300 lg:static lg:z-auto lg:w-full lg:shadow-none ${
            sidebarCompact ? "w-[88px]" : "w-[280px]"
          }`}
          style={{ background: "var(--brand-shell-panel)" }}
        >
          <div className="pointer-events-none absolute inset-0">
            <div
              className="absolute inset-x-0 top-0 h-px opacity-80"
              style={{ background: "var(--brand-chrome)" }}
            />
            <div className="absolute inset-y-0 right-0 w-px bg-white/10" />
            <div className="absolute -left-8 top-24 h-40 w-40 rounded-full bg-[rgba(214,216,216,0.12)] blur-3xl" />
            <div className="absolute -right-10 top-14 h-44 w-44 rounded-full bg-[rgba(72,201,77,0.18)] blur-3xl" />
            <div className="absolute bottom-0 left-0 h-36 w-full bg-[linear-gradient(180deg,transparent_0%,rgba(31,143,47,0.14)_100%)]" />
            <div className="absolute right-6 top-6 h-16 w-16 rounded-full border border-[rgba(185,153,79,0.24)]" />
          </div>
          <div
            className={`relative flex h-full flex-col overflow-y-auto p-4 ${
              sidebarCompact ? "items-center" : ""
            }`}
          >
            {sidebarCompact ? (
              <div className="flex h-14 w-14 items-center justify-center rounded-[22px] border border-white/10 bg-black/40 shadow-[inset_0_1px_0_rgba(255,255,255,0.12)] backdrop-blur">
                <span
                  className="bg-clip-text text-lg font-semibold tracking-[0.08em] text-transparent"
                  style={{ backgroundImage: "linear-gradient(135deg,#f6f8f9_0%,#b2bbc1_30%,#58db5c_70%,#1f8f2f_100%)" }}
                >
                  RG
                </span>
              </div>
            ) : (
              <div className="w-full rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02))] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
                <div className="overflow-hidden rounded-[22px] border border-white/8 bg-black/80 shadow-[0_16px_40px_rgba(0,0,0,0.3)]">
                  <Image
                    alt="Rehoboth Group LLC logo"
                    className="h-auto w-full"
                    height={768}
                    priority
                    src="/rehoboth-logo.jpeg"
                    width={1152}
                  />
                </div>
                <div className="mt-4">
                  <p
                    className="bg-clip-text text-sm font-semibold tracking-[0.1em] text-transparent"
                    style={{ backgroundImage: "var(--brand-green-chrome)" }}
                  >
                    Rehoboth Lending
                  </p>
                  <p className="mt-1 text-sm text-white/68">Single-tenant CRM and lending demo</p>
                  <div className="mt-3 h-px w-full bg-[linear-gradient(90deg,rgba(214,216,216,0.92),rgba(31,143,47,0.92),rgba(185,153,79,0.8))]" />
                </div>
              </div>
            )}

            <nav
              className={`mt-6 grid w-full gap-2 text-sm ${
                sidebarCompact ? "justify-items-center" : ""
              }`}
            >
              {navigationItems.map((item) => (
              <NavItem key={item.href} compact={sidebarCompact} {...item} />
            ))}
          </nav>

            {sidebarCompact ? (
              <div className="mt-6 rounded-[22px] border border-[rgba(185,153,79,0.18)] bg-[linear-gradient(180deg,rgba(31,143,47,0.16),rgba(255,255,255,0.03))] px-3 py-4 text-center">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--brand-gold)]">
                  MVP
                </p>
              </div>
            ) : (
              <div className="mt-6 rounded-[24px] border border-[rgba(185,153,79,0.18)] bg-[linear-gradient(180deg,rgba(31,143,47,0.16),rgba(255,255,255,0.03))] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--brand-gold)]">
                  This phase
                </p>
                <p className="mt-2 text-sm leading-6 text-white/76">
                  Dashboard, lead intake, pipeline board, borrower workspace, client
                  file, submission summary, task center, workflow launcher, bulk
                  actions, document flow, capital sources, lender portal,
                  scenarios desk,
                  ratesheets, and reports are live for the first demo.
                </p>
              </div>
            )}
          </div>
        </aside>

        <main
          className={`ml-0 min-w-0 p-4 transition-[padding] duration-300 md:p-6 lg:p-8 ${
            clientRailCompact ? "xl:pr-[112px]" : "xl:pr-[392px]"
          }`}
        >
          <div className="sticky top-4 z-20 mb-4 flex flex-wrap items-center gap-2">
            <button
              aria-controls="rehoboth-sidebar"
              aria-expanded={!sidebarCompact}
              aria-label={sidebarCompact ? "Expand sidebar" : "Compact sidebar"}
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[color:var(--app-toggle-border)] bg-[color:var(--app-toggle-bg)] text-[color:var(--app-toggle-text)] shadow-[var(--secondary-button-shadow)] transition hover:border-[color:var(--app-toggle-hover-border)] hover:bg-[color:var(--app-toggle-hover-bg)]"
              onClick={() => setSidebarCompact((current) => !current)}
              title={sidebarCompact ? "Expand sidebar" : "Compact sidebar"}
              type="button"
            >
              <span className="sr-only">
                {sidebarCompact ? "Expand sidebar" : "Compact sidebar"}
              </span>
              <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24">
                <path
                  d={
                    sidebarCompact
                      ? "M9.75 6.75L15.25 12L9.75 17.25M5.75 6.75H6.25M5.75 12H6.25M5.75 17.25H6.25"
                      : "M14.25 6.75L8.75 12L14.25 17.25M17.75 6.75H18.25M17.75 12H18.25M17.75 17.25H18.25"
                  }
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.7"
                />
              </svg>
            </button>
            <ThemeToggleButton compact={sidebarCompact} />
          </div>
          {children}
          <QuickToolsWidget />
          <RehobothExpert clientToolbarCompact={clientRailCompact} />
          <Suspense fallback={null}>
            <ClientQuickAccessToolbar
              compact={clientRailCompact}
              onToggleCompact={() => setClientRailCompact(!clientRailCompact)}
            />
          </Suspense>
        </main>
      </div>
    </div>
  );
}

function NavItem({
  href,
  label,
  icon,
  compact,
}: {
  href: string;
  label: string;
  icon: ReactNode;
  compact: boolean;
}) {
  const pathname = usePathname();
  const active =
    href === "/"
      ? pathname === href
      : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link
      aria-label={label}
      href={href}
      title={label}
      className={`group rounded-2xl border transition ${
        active
          ? "border-[rgba(185,153,79,0.18)] bg-[linear-gradient(90deg,rgba(255,255,255,0.08),rgba(31,143,47,0.16))] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]"
          : "border-transparent text-white/76 hover:border-white/8 hover:bg-white/8 hover:text-white"
      } ${
        compact
          ? "flex h-12 w-12 items-center justify-center p-0"
          : "flex items-center gap-3 px-4 py-3"
      }`}
    >
      <span
        className={`transition [&_svg]:h-full [&_svg]:w-full ${
          active ? "text-[var(--brand-green-bright)]" : "text-white/78 group-hover:text-white"
        } ${
          compact ? "h-5 w-5" : "h-4 w-4"
        }`}
      >
        {icon}
      </span>
      {compact ? <span className="sr-only">{label}</span> : <span>{label}</span>}
    </Link>
  );
}
