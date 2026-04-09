import Link from "next/link";
import { ReactNode } from "react";
import { PortalAssistant } from "@/components/portal-assistant";
import { ThemeToggleButton } from "@/components/theme-toggle";

export function PortalShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen text-[color:var(--foreground)] [background:var(--portal-shell-bg)]">
      <div className="mx-auto max-w-[1320px] px-4 pb-10 pt-5 md:px-6 lg:px-8">
        <header
          className="mb-6 rounded-[28px] border px-5 py-4 backdrop-blur"
          style={{
            background: "var(--portal-shell-surface)",
            borderColor: "var(--portal-shell-border)",
            boxShadow: "var(--panel-shadow)",
          }}
        >
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                Rehoboth Group LLC
              </p>
              <Link
                className="mt-2 inline-flex items-center text-2xl font-semibold tracking-[-0.04em] text-slate-950"
                href="/portal"
              >
                Client Portal
              </Link>
            </div>

            <nav className="flex flex-wrap gap-2 text-sm">
              <NavLink href="/portal">Portal home</NavLink>
              <NavLink href="/">Internal workspace</NavLink>
              <NavLink href="/pipeline">Pipeline board</NavLink>
              <ThemeToggleButton />
            </nav>
          </div>
        </header>

        {children}

        <footer
          className="mt-6 rounded-[28px] border px-5 py-4 text-sm text-slate-600 backdrop-blur"
          style={{
            background: "var(--portal-shell-surface)",
            borderColor: "var(--portal-shell-border)",
            boxShadow: "var(--panel-shadow)",
          }}
        >
          Upload requested documents, track milestones, and keep the deal moving without waiting on a status email.
        </footer>
      </div>
      <PortalAssistant />
    </div>
  );
}

function NavLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      className="inline-flex items-center justify-center rounded-full border border-[color:var(--secondary-button-border)] bg-[color:var(--secondary-button-bg)] px-4 py-2.5 font-medium text-[color:var(--secondary-button-text)] shadow-[var(--secondary-button-shadow)] transition hover:border-[color:var(--secondary-button-hover-border)] hover:bg-[color:var(--secondary-button-hover-bg)]"
      href={href}
    >
      {children}
    </Link>
  );
}
