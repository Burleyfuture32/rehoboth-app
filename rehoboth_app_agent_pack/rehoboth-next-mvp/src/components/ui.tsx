import { ReactNode } from "react";

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  className,
}: {
  eyebrow: string;
  title: string;
  description: string;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`relative mb-6 overflow-hidden rounded-[36px] border ${className ?? ""}`}
      style={{
        background: "var(--page-header-bg)",
        borderColor: "var(--page-header-border)",
        boxShadow: "var(--page-header-shadow)",
      }}
    >
      <div
        className="pointer-events-none absolute inset-x-8 top-0 h-[3px] rounded-full"
        style={{ background: "var(--page-header-accent)" }}
      />
      <div
        className="pointer-events-none absolute -left-20 top-[-4.5rem] h-64 w-64 rounded-full blur-3xl"
        style={{ background: "var(--page-header-glow-left)" }}
      />
      <div
        className="pointer-events-none absolute right-[-3.5rem] top-[-2rem] h-48 w-48 rounded-full blur-3xl"
        style={{ background: "var(--page-header-glow-right)" }}
      />
      <div
        className="pointer-events-none absolute bottom-[-5rem] left-[18%] h-56 w-56 rounded-full blur-3xl"
        style={{ background: "var(--page-header-glow-bottom)" }}
      />
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-24"
        style={{ background: "var(--page-header-bottom-fade)" }}
      />
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: "var(--page-header-overlay)" }}
      />

      <header className="relative flex flex-col gap-4 px-6 py-7 sm:px-8 sm:py-8 lg:flex-row lg:items-end lg:justify-between lg:px-10">
        <div>
          <p
            className="text-xs font-semibold uppercase tracking-[0.2em]"
            style={{ color: "var(--page-header-eyebrow)" }}
          >
            {eyebrow}
          </p>
          <h1
            className="mt-2 font-serif text-4xl tracking-[-0.04em] sm:text-5xl"
            style={{ color: "var(--page-header-title)" }}
          >
            {title}
          </h1>
          <p
            className="mt-3 max-w-3xl text-base leading-7"
            style={{ color: "var(--page-header-body)" }}
          >
            {description}
          </p>
        </div>
        {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
      </header>
    </section>
  );
}

export function Panel({
  title,
  description,
  children,
  action,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <section
      className="relative overflow-hidden rounded-[28px] border border-[color:var(--border-soft)] bg-[color:var(--surface)] p-5 backdrop-blur"
      style={{ boxShadow: "var(--panel-shadow)" }}
    >
      <div
        className="pointer-events-none absolute inset-x-5 top-0 h-px"
        style={{ background: "var(--page-header-accent)" }}
      />
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
          {description ? (
            <p className="mt-1 text-sm leading-6 text-slate-500">{description}</p>
          ) : null}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

export function MetricCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div
      className="relative overflow-hidden rounded-[24px] border border-[color:var(--border-soft)] bg-[color:var(--surface)] p-5 backdrop-blur"
      style={{ boxShadow: "var(--panel-shadow)" }}
    >
      <div
        className="pointer-events-none absolute inset-x-4 top-0 h-px"
        style={{ background: "var(--page-header-accent)" }}
      />
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-slate-950">
        {value}
      </p>
      <p className="mt-2 text-sm leading-6 text-slate-500">{detail}</p>
    </div>
  );
}

export function PrimaryLink({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <a
      className="inline-flex items-center justify-center rounded-full border border-black/10 px-5 py-3 text-sm font-medium text-white shadow-[0_14px_30px_rgba(17,77,26,0.24)] transition hover:brightness-[1.04]"
      style={{ background: "var(--brand-green-chrome)" }}
      href={href}
    >
      {children}
    </a>
  );
}

export function SecondaryLink({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <a
      className="inline-flex items-center justify-center rounded-full border border-[color:var(--secondary-button-border)] bg-[color:var(--secondary-button-bg)] px-5 py-3 text-sm font-medium text-[color:var(--secondary-button-text)] shadow-[var(--secondary-button-shadow)] backdrop-blur-xl transition hover:border-[color:var(--secondary-button-hover-border)] hover:bg-[color:var(--secondary-button-hover-bg)]"
      href={href}
    >
      {children}
    </a>
  );
}

export function StageChip({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex rounded-full border border-white/20 bg-[rgba(255,255,255,0.18)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--brand-green-deep)] backdrop-blur-xl shadow-[inset_0_1px_0_rgba(255,255,255,0.22)]">
      {children}
    </span>
  );
}
