import Link from "next/link";
import { AppFrame } from "@/components/app-frame";
import { PageHeader, Panel, PrimaryLink, SecondaryLink, StageChip } from "@/components/ui";
import { currency } from "@/lib/format";
import { getSearchResults } from "@/lib/search";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const params = await searchParams;
  const query = params.q ?? "";
  const { deals, shortcuts } = await getSearchResults(query);

  return (
    <AppFrame>
      <PageHeader
        eyebrow="Search"
        title={query ? `Results for "${query}"` : "Search the Rehoboth system"}
        description="Search deals, borrowers, and core app sections from one place."
        actions={
          <>
            <PrimaryLink href="/pipeline">Back to pipeline</PrimaryLink>
            <SecondaryLink href="/">Open dashboard</SecondaryLink>
          </>
        }
      />

      {!query ? (
        <Panel
          title="Search tips"
          description="Try a borrower name, property, lender workflow, or a section like tasks, pipeline, communications, or ratesheets."
        >
          <div className="flex flex-wrap gap-2">
            {["Tim Webb", "Bean Path", "communications", "ratesheets", "workflows"].map(
              (tip) => (
                <Link
                  key={tip}
                  className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-100"
                  href={`/search?q=${encodeURIComponent(tip)}`}
                >
                  {tip}
                </Link>
              ),
            )}
          </div>
        </Panel>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_360px]">
        <Panel
          title="Deal and borrower matches"
          description="Jump straight into a file when you know the borrower, property, or program."
        >
          <div className="space-y-3">
            {deals.length === 0 ? (
              <div className="rounded-[20px] border border-dashed border-slate-200 bg-slate-50/60 px-4 py-6 text-sm text-slate-500">
                No deal matches yet.
              </div>
            ) : null}

            {deals.map((deal) => (
              <article
                key={deal.id}
                className="rounded-[22px] border border-slate-200 bg-slate-50/70 p-4"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <StageChip>{deal.dealType}</StageChip>
                  <span className="text-xs font-medium uppercase tracking-[0.16em] text-slate-500">
                    {deal.stage.replaceAll("_", " ")}
                  </span>
                </div>
                <h2 className="mt-3 text-lg font-semibold text-slate-950">
                  {deal.name}
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  {deal.borrower.name} | {deal.program}
                </p>
                <p className="mt-2 text-sm text-slate-500">{deal.propertyAddress}</p>
                <div className="mt-4 grid gap-3 md:grid-cols-3">
                  <Metric label="Loan amount" value={currency(deal.loanAmount)} />
                  <Metric label="Market" value={deal.market} />
                  <Metric label="Source" value={deal.source} />
                </div>
                <div className="mt-4 flex flex-wrap gap-3">
                  <SecondaryLink href={`/deals/${deal.id}`}>Open workspace</SecondaryLink>
                  <SecondaryLink href={`/deals/${deal.id}/communications`}>
                    Open communications
                  </SecondaryLink>
                  <SecondaryLink href={`/workflows?dealId=${deal.id}`}>
                    Launch workflow
                  </SecondaryLink>
                </div>
              </article>
            ))}
          </div>
        </Panel>

        <Panel
          title="Section matches"
          description="Use this when you remember the function but not the exact page."
        >
          <div className="space-y-3">
            {shortcuts.length === 0 ? (
              <div className="rounded-[20px] border border-dashed border-slate-200 bg-slate-50/60 px-4 py-6 text-sm text-slate-500">
                No section matches yet.
              </div>
            ) : null}

            {shortcuts.map((shortcut) => (
              <article
                key={shortcut.href}
                className="rounded-[20px] border border-slate-200 bg-slate-50/70 p-4"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                  {shortcut.category}
                </p>
                <h2 className="mt-2 text-base font-semibold text-slate-950">
                  {shortcut.label}
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {shortcut.description}
                </p>
                <div className="mt-4">
                  <SecondaryLink href={shortcut.href}>Open section</SecondaryLink>
                </div>
              </article>
            ))}
          </div>
        </Panel>
      </div>
    </AppFrame>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[18px] border border-slate-200 bg-white px-4 py-3">
      <p className="text-xs uppercase tracking-[0.16em] text-slate-500">{label}</p>
      <p className="mt-2 text-sm font-medium text-slate-900">{value}</p>
    </div>
  );
}
