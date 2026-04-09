import { CapitalSourceStatus } from "@prisma/client";
import Link from "next/link";
import { updateCapitalSourceAction } from "@/app/actions";
import { AppFrame } from "@/components/app-frame";
import { PageHeader, Panel, PrimaryLink, StageChip } from "@/components/ui";
import { getCapitalSourcesPageData } from "@/lib/capital-sources";

const statusTone = {
  TARGETED: "bg-slate-100 text-slate-700",
  SUBMITTED: "bg-amber-50 text-amber-800",
  QUOTE_RECEIVED: "bg-emerald-50 text-emerald-800",
  PASSED: "bg-rose-50 text-rose-800",
} as const;

export default async function CapitalSourcesPage() {
  const { matches, counts } = await getCapitalSourcesPageData();

  return (
    <AppFrame>
      <PageHeader
        eyebrow="Capital sources"
        title="A simple lender pipeline for live files"
        description="This keeps lender and capital-source outreach visible without turning the MVP into a marketplace or broker portal."
        actions={
          <>
            <PrimaryLink href="/pipeline">Back to pipeline</PrimaryLink>
            <PrimaryLink href="/ratesheets">View ratesheets</PrimaryLink>
          </>
        }
      />

      <div className="mb-4 grid gap-4 md:grid-cols-4">
        {counts.map((item) => (
          <div
            key={item.status}
            className="rounded-[20px] border border-slate-200 bg-slate-50/70 p-4"
          >
            <p className="text-sm text-slate-500">{item.status.replaceAll("_", " ")}</p>
            <p className="mt-2 text-2xl font-semibold text-slate-950">{item.count}</p>
          </div>
        ))}
      </div>

      <Panel
        title="Tracked lender matches"
        description="Each row ties a capital source to a live deal and shows where outreach stands."
      >
        <div className="space-y-3">
          {matches.length === 0 ? (
            <div className="rounded-[20px] border border-dashed border-slate-200 bg-slate-50/60 px-4 py-6 text-sm text-slate-500">
              No capital sources tracked yet.
            </div>
          ) : null}

          {matches.map((match) => (
            <article
              key={match.id}
              className="rounded-[22px] border border-slate-200 bg-slate-50/70 p-4"
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] ${statusTone[match.status]}`}
                    >
                      {match.status.replaceAll("_", " ")}
                    </span>
                    <StageChip>{match.deal.dealType}</StageChip>
                  </div>
                  <h3 className="mt-3 text-lg font-semibold text-slate-950">
                    {match.lenderName}
                  </h3>
                  <p className="mt-1 text-sm text-slate-600">{match.program}</p>
                  <p className="mt-3 text-sm text-slate-500">
                    {match.deal.name} | {match.deal.borrower.name}
                  </p>
                </div>

                <div className="grid gap-3 text-sm md:grid-cols-3 lg:min-w-[360px]">
                  <Metric label="Quote amount" value={match.quoteAmount ?? "-"} />
                  <Metric label="Leverage" value={match.leverage ?? "-"} />
                  <Metric label="Rate" value={match.rate ?? "-"} />
                </div>
              </div>

              {match.notes ? (
                <p className="mt-3 text-sm leading-6 text-slate-600">{match.notes}</p>
              ) : null}

              <form
                action={updateCapitalSourceAction}
                className="mt-4 grid gap-4 rounded-[20px] border border-slate-200 bg-white p-4"
              >
                <input name="matchId" type="hidden" value={match.id} />
                <input name="returnTo" type="hidden" value="/capital-sources" />
                <div className="grid gap-4 xl:grid-cols-4">
                  <label className="grid gap-2 text-sm">
                    <span className="font-medium text-slate-700">Status</span>
                    <select
                      className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-emerald-400"
                      defaultValue={match.status}
                      name="status"
                    >
                      {Object.values(CapitalSourceStatus).map((status) => (
                        <option key={status} value={status}>
                          {status.replaceAll("_", " ")}
                        </option>
                      ))}
                    </select>
                  </label>
                  <Field
                    defaultValue={match.quoteAmount ?? ""}
                    label="Quote amount"
                    name="quoteAmount"
                  />
                  <Field
                    defaultValue={match.leverage ?? ""}
                    label="Leverage"
                    name="leverage"
                  />
                  <Field defaultValue={match.rate ?? ""} label="Rate" name="rate" />
                </div>
                <label className="grid gap-2 text-sm">
                  <span className="font-medium text-slate-700">Notes</span>
                  <textarea
                    className="min-h-20 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-emerald-400"
                    defaultValue={match.notes ?? ""}
                    name="notes"
                  />
                </label>
                <div className="flex flex-wrap gap-3">
                  <button
                    className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-100"
                    type="submit"
                  >
                    Save lender update
                  </button>
                  <Link
                    className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-slate-950 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800"
                    href="/ratesheets"
                  >
                    Open ratesheets
                  </Link>
                </div>
              </form>

              <div className="mt-4">
                <Link
                  className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-100"
                  href={`/deals/${match.dealId}/summary`}
                >
                  Open deal summary
                </Link>
              </div>
            </article>
          ))}
        </div>
      </Panel>
    </AppFrame>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[18px] border border-slate-200 bg-white px-4 py-3">
      <p className="text-xs uppercase tracking-[0.16em] text-slate-500">{label}</p>
      <p className="mt-2 font-medium text-slate-900">{value}</p>
    </div>
  );
}

function Field({
  label,
  name,
  defaultValue,
}: {
  label: string;
  name: string;
  defaultValue?: string;
}) {
  return (
    <label className="grid gap-2 text-sm">
      <span className="font-medium text-slate-700">{label}</span>
      <input
        className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-emerald-400"
        defaultValue={defaultValue}
        name={name}
      />
    </label>
  );
}
