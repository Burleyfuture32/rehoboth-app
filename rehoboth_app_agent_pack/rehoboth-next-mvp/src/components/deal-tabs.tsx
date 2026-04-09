import Link from "next/link";

const tabs = [
  { key: "workspace", label: "Workspace", suffix: "" },
  { key: "communications", label: "Communications", suffix: "/communications" },
  { key: "status-tracker", label: "Status Tracker", suffix: "/status-tracker" },
  { key: "summary", label: "Submission Summary", suffix: "/summary" },
  { key: "file", label: "Client File", suffix: "/file" },
] as const;

export function DealTabs({
  current,
  dealId,
}: {
  current: (typeof tabs)[number]["key"];
  dealId: string;
}) {
  return (
    <nav className="mb-6 flex flex-wrap gap-2">
      {tabs.map((tab) => {
        const href = `/deals/${dealId}${tab.suffix}`;
        const isActive = tab.key === current;

        return (
          <Link
            key={tab.key}
            className={`inline-flex items-center justify-center rounded-full border px-4 py-2.5 text-sm font-medium transition ${
              isActive
                ? "border-[var(--brand-green)] bg-[var(--brand-green)] text-white shadow-[0_10px_24px_rgba(31,143,47,0.22)]"
                : "border-[color:var(--border-soft)] bg-white text-slate-700 hover:border-[var(--brand-silver)] hover:bg-[color:var(--surface-muted)]"
            }`}
            href={href}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
