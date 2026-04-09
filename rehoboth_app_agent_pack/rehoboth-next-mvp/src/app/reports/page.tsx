import Link from "next/link";
import { AppFrame } from "@/components/app-frame";
import {
  MetricCard,
  PageHeader,
  Panel,
  PrimaryLink,
  SecondaryLink,
} from "@/components/ui";
import { compactCurrency, currency } from "@/lib/format";
import { getReportsData } from "@/lib/reports";

const starterPrompts = [
  "Show me clients stuck waiting on documents",
  "Give me a report on residential files close to submission",
  "Which CRE deals need the most follow-up right now?",
] as const;

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ request?: string }>;
}) {
  const params = await searchParams;
  const request = params.request?.trim() ?? "";
  const { metrics, stageCounts, submissionCounts, capitalCounts, dealRows, customReport } =
    await getReportsData(request);

  return (
    <AppFrame>
      <PageHeader
        eyebrow="Reports"
        title="Plain-language operating metrics"
        description="This first reporting surface keeps the numbers obvious: pipeline shape, submission readiness, document pressure, lender activity, and now custom report requests."
        actions={
          <>
            <PrimaryLink href="#custom-report">Create custom report</PrimaryLink>
            <SecondaryLink href="/pipeline">Back to pipeline</SecondaryLink>
          </>
        }
      />

      <Panel
        title="Custom report builder"
        description="Type what you need in plain English and the app will shape a report around the matching files."
        action={
          request ? (
            <Link
              className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-100"
              href="/reports"
            >
              Clear
            </Link>
          ) : null
        }
      >
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]" id="custom-report">
          <form action="/reports" className="space-y-4" method="get">
            <label className="block">
              <span className="text-sm font-medium text-slate-700">
                What report do you need?
              </span>
              <textarea
                className="mt-2 min-h-[132px] w-full rounded-[22px] border border-slate-200 bg-slate-50/70 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-300 focus:bg-white"
                defaultValue={request}
                name="request"
                placeholder="Example: show me borrowers with the most open tasks and pending documents"
              />
            </label>
            <div className="flex flex-wrap gap-3">
              <button
                className="inline-flex items-center justify-center rounded-full bg-emerald-700 px-5 py-3 text-sm font-medium text-white transition hover:bg-emerald-800"
                type="submit"
              >
                Build report
              </button>
              <Link
                className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-100"
                href="/reports"
              >
                Reset
              </Link>
            </div>
          </form>

          <div className="rounded-[24px] border border-slate-200 bg-slate-50/70 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              Starter prompts
            </p>
            <div className="mt-3 flex flex-col gap-3">
              {starterPrompts.map((prompt) => (
                <Link
                  key={prompt}
                  className="rounded-[18px] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 transition hover:border-slate-300 hover:bg-slate-100"
                  href={`/reports?request=${encodeURIComponent(prompt)}#custom-report`}
                >
                  {prompt}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </Panel>

      {customReport ? (
        <div className="mt-4 space-y-4">
          <Panel
            title={customReport.title}
            description={customReport.description}
          >
            <div className="flex flex-wrap gap-2">
              {customReport.focusLabels.map((label) => (
                <span
                  key={label}
                  className="rounded-full bg-[rgba(31,143,47,0.12)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--brand-green-deep)]"
                >
                  {label}
                </span>
              ))}
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
              {customReport.metrics.map((metric) => (
                <MetricCard
                  key={metric.label}
                  label={metric.label}
                  value={metric.value}
                  detail={metric.detail}
                />
              ))}
            </div>
          </Panel>

          <div className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
            <Panel
              title="Matching files"
              description="The files below are the best matches for the current report request."
            >
              <div className="space-y-3">
                {customReport.deals.map((deal) => (
                  <article
                    key={deal.id}
                    className="rounded-[22px] border border-slate-200 bg-slate-50/70 p-4"
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-slate-950">
                          {deal.name}
                        </h3>
                        <p className="mt-1 text-sm text-slate-600">
                          {deal.borrowerName} | {deal.market} | {deal.stage.replaceAll("_", " ")}
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2 text-xs font-medium text-slate-600">
                          <span className="rounded-full bg-white px-3 py-1">
                            {deal.dealType}
                          </span>
                          <span className="rounded-full bg-white px-3 py-1">
                            Loan {currency(deal.loanAmount)}
                          </span>
                          <span className="rounded-full bg-white px-3 py-1">
                            {deal.openTasks} open task{deal.openTasks === 1 ? "" : "s"}
                          </span>
                          <span className="rounded-full bg-white px-3 py-1">
                            {deal.requestedDocuments} requested doc
                            {deal.requestedDocuments === 1 ? "" : "s"}
                          </span>
                          <span className="rounded-full bg-white px-3 py-1">
                            {deal.submissionStatus.replaceAll("_", " ")}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2 lg:min-w-[180px]">
                        <Link
                          className="inline-flex items-center justify-center rounded-full bg-emerald-700 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-emerald-800"
                          href={`/deals/${deal.id}`}
                        >
                          Open workspace
                        </Link>
                        <Link
                          className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-100"
                          href={`/deals/${deal.id}/summary`}
                        >
                          Open summary
                        </Link>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </Panel>

            <div className="grid gap-4">
              <Panel
                title="Key findings"
                description="The fastest readout from the current request."
              >
                <div className="space-y-3">
                  {customReport.insights.map((insight) => (
                    <div
                      key={insight}
                      className="rounded-[18px] border border-slate-200 bg-slate-50/70 px-4 py-3 text-sm leading-6 text-slate-700"
                    >
                      {insight}
                    </div>
                  ))}
                </div>
              </Panel>

              <Panel
                title="Recommended next moves"
                description="A practical sequence to act on the files in this report."
              >
                <div className="space-y-3">
                  {customReport.nextMoves.map((move) => (
                    <div
                      key={move}
                      className="rounded-[18px] border border-slate-200 bg-slate-50/70 px-4 py-3 text-sm leading-6 text-slate-700"
                    >
                      {move}
                    </div>
                  ))}
                </div>
              </Panel>
            </div>
          </div>
        </div>
      ) : null}

      <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <MetricCard
          label="Live deals"
          value={`${metrics.totalDeals}`}
          detail="All residential and CRE files currently tracked."
        />
        <MetricCard
          label="Volume"
          value={compactCurrency(metrics.totalVolume)}
          detail="Total requested loan amount across live deals."
        />
        <MetricCard
          label="Open tasks"
          value={`${metrics.openTasks}`}
          detail="Pending work still open across the team."
        />
        <MetricCard
          label="Requested docs"
          value={`${metrics.requestedDocuments}`}
          detail="Outstanding document asks slowing files down."
        />
        <MetricCard
          label="Capital sources"
          value={`${metrics.activeCapitalSources}`}
          detail="Tracked lender or capital source matches."
        />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        <Panel title="Pipeline stages" description="Current file distribution by stage.">
          <div className="space-y-3">
            {stageCounts.map(([stage, count]) => (
              <Row key={stage} label={stage.replaceAll("_", " ")} value={`${count}`} />
            ))}
          </div>
        </Panel>

        <Panel
          title="Submission readiness"
          description="How close files are to actual lender handoff."
        >
          <div className="space-y-3">
            {submissionCounts.map((item) => (
              <Row
                key={item.status}
                label={item.status.replaceAll("_", " ")}
                value={`${item.count}`}
              />
            ))}
          </div>
        </Panel>

        <Panel
          title="Capital source status"
          description="Where lender outreach currently stands."
        >
          <div className="space-y-3">
            {capitalCounts.map((item) => (
              <Row
                key={item.status}
                label={item.status.replaceAll("_", " ")}
                value={`${item.count}`}
              />
            ))}
          </div>
        </Panel>
      </div>

      <div className="mt-4">
        <Panel
          title="Deal operations view"
          description="A compact report for founders or operators who want one screen of file health."
        >
          <div className="space-y-3">
            {dealRows.map((deal) => (
              <article
                key={deal.id}
                className="rounded-[22px] border border-slate-200 bg-slate-50/70 p-4"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-950">{deal.name}</h3>
                    <p className="mt-1 text-sm text-slate-600">
                      {deal.borrowerName} | {deal.stage.replaceAll("_", " ")}
                    </p>
                  </div>
                  <div className="grid gap-3 text-sm md:grid-cols-4 lg:min-w-[520px]">
                    <RowCard
                      label="Submission"
                      value={deal.submissionStatus.replaceAll("_", " ")}
                    />
                    <RowCard label="Open tasks" value={`${deal.openTasks}`} />
                    <RowCard label="Requested docs" value={`${deal.requestedDocuments}`} />
                    <RowCard label="Capital sources" value={`${deal.capitalSources}`} />
                  </div>
                </div>
                <div className="mt-4">
                  <Link
                    className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-100"
                    href={`/deals/${deal.id}/summary`}
                  >
                    Open summary
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </Panel>
      </div>
    </AppFrame>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-[18px] border border-slate-200 bg-slate-50/70 px-4 py-3 text-sm">
      <span className="text-slate-600">{label}</span>
      <strong className="text-slate-950">{value}</strong>
    </div>
  );
}

function RowCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[18px] border border-slate-200 bg-white px-4 py-3">
      <p className="text-xs uppercase tracking-[0.16em] text-slate-500">{label}</p>
      <p className="mt-2 font-medium text-slate-900">{value}</p>
    </div>
  );
}
