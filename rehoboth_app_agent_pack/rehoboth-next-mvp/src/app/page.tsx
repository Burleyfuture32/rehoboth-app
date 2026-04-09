import Link from "next/link";
import { AppFrame } from "@/components/app-frame";
import {
  MetricCard,
  PageHeader,
  Panel,
  PrimaryLink,
  SecondaryLink,
  StageChip,
} from "@/components/ui";
import { compactCurrency, currency, shortDate } from "@/lib/format";
import { getDashboardData } from "@/lib/dashboard";

const dashboardFaqs = [
  {
    question: "What is this first screen supposed to show?",
    answer:
      "The dashboard is the investor-demo starting point. It summarizes live deals, recent opportunities, lead sources, and the recommended walkthrough across the full lending workflow.",
    href: "/",
    linkLabel: "Stay on dashboard",
  },
  {
    question: "Where should a new borrower or broker lead start?",
    answer:
      "Start in Lead Intake. That form captures the borrower, deal basics, and property details, then creates the new file so it appears on the dashboard and pipeline immediately.",
    href: "/leads/intake",
    linkLabel: "Open lead intake",
  },
  {
    question: "Does the same workflow handle residential and CRE deals?",
    answer:
      "Yes. This MVP keeps residential and CRE opportunities inside the same intake, dashboard, pipeline, task, and reporting flow so the team can demo both without switching systems.",
    href: "/pipeline",
    linkLabel: "Open pipeline",
  },
  {
    question: "How do I move a file from one stage to the next?",
    answer:
      "Use the pipeline board or the deal workspace. Both surfaces expose an advance-stage action so the file can move from lead through processing, underwriting, docs requested, and closing.",
    href: "/pipeline",
    linkLabel: "View pipeline stages",
  },
  {
    question: "Where do I see the next thing that needs attention?",
    answer:
      "The Task Center shows work across all files, while each deal workspace keeps that file's tasks, document pressure, submission readiness, and recommended next move together in one place.",
    href: "/tasks",
    linkLabel: "Open task center",
  },
  {
    question: "How are document requests and uploads handled in the demo?",
    answer:
      "The document center lets the team request a file, upload it, and keep that status tied to the deal workspace. Demo uploads are stored locally in public/demo-uploads so the app works offline.",
    href: "/documents",
    linkLabel: "Open documents",
  },
  {
    question: "How do I know whether a file is ready to submit to lenders?",
    answer:
      "Open the submission summary for the deal. It combines open tasks, missing documents, lender activity, and manual notes into a simple readiness status with a recommended next action.",
    href: "/pipeline",
    linkLabel: "Open a deal from pipeline",
  },
  {
    question: "Where do lender matches and pricing live?",
    answer:
      "Capital Sources tracks outreach on active files, while Ratesheets acts as the comparison directory for lender appetite, leverage, rough pricing, and contact information.",
    href: "/capital-sources",
    linkLabel: "Open capital sources",
  },
  {
    question: "What do the reports actually measure?",
    answer:
      "Reports focus on plain-language operating metrics: live deal count, volume, open tasks, requested documents, submission readiness, stage distribution, and capital-source activity.",
    href: "/reports",
    linkLabel: "Open reports",
  },
  {
    question: "Is this a production multi-tenant system yet?",
    answer:
      "No. This phase is a single-tenant MVP built for demo clarity first. It runs on local SQLite demo data, keeps uploads local, and favors obvious workflow over production complexity.",
    href: "/",
    linkLabel: "Back to dashboard",
  },
  {
    question: "What is The RehoBOT button for?",
    answer:
      "The RehoBOT is an in-app helper that answers screen and workflow questions without leaving the demo. Use it when you need a quick pointer to the right route or the next step on a file.",
    href: "/pipeline",
    linkLabel: "Start from pipeline",
  },
] as const;

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ created?: string }>;
}) {
  const [{ deals, metrics, sources }, params] = await Promise.all([
    getDashboardData(),
    searchParams,
  ]);

  const createdDeal = params.created
    ? deals.find((deal) => deal.id === params.created)
    : undefined;

  return (
    <AppFrame>
      <PageHeader
        eyebrow="Dashboard"
        title="A calm first screen for Rehoboth's lending team"
        description="This first slice stays investor-demo friendly: live metrics, clear recent deals, and one obvious next step into lead intake."
        actions={
          <>
            <PrimaryLink href="/leads/intake">Add new lead</PrimaryLink>
            <SecondaryLink href="/portal">Open client portal</SecondaryLink>
            <SecondaryLink href="/lender-portal">Open lender portal</SecondaryLink>
            <SecondaryLink href="/pipeline">Open pipeline</SecondaryLink>
            <SecondaryLink href="/documents">Open documents</SecondaryLink>
            <SecondaryLink href="/reports">Open reports</SecondaryLink>
            <SecondaryLink href="/leads/intake?preset=cre">
              Try CRE example
            </SecondaryLink>
          </>
        }
      />

      {createdDeal ? (
        <div className="mb-6 rounded-[24px] border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-900">
          <strong>{createdDeal.name}</strong> was added to the dashboard and is now
          visible at the top of recent opportunities.
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <MetricCard
          label="Live deals"
          value={`${metrics.totalDeals}`}
          detail="Single dashboard across residential and CRE opportunities."
        />
        <MetricCard
          label="Residential"
          value={`${metrics.residentialCount}`}
          detail="Rental and DSCR-style opportunities in the current seed set."
        />
        <MetricCard
          label="CRE"
          value={`${metrics.creCount}`}
          detail="Bridge and multifamily opportunities share the same intake path."
        />
        <MetricCard
          label="Volume"
          value={compactCurrency(metrics.totalVolume)}
          detail="Local demo data stored in SQLite through Prisma."
        />
        <MetricCard
          label="Open tasks"
          value={`${metrics.openTasks}`}
          detail="Task center now shows the work queue behind each live deal."
        />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1.45fr)_minmax(360px,0.85fr)]">
        <Panel
          title="Recent opportunities"
          description="The first dashboard view favors clarity over analytics depth."
        >
          <div className="space-y-4">
            {deals.map((deal) => (
              <div
                key={deal.id}
                className="flex flex-col gap-4 rounded-[22px] border border-slate-200/80 bg-slate-50/70 p-4 md:flex-row md:items-start md:justify-between"
              >
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <StageChip>{deal.stage.replaceAll("_", " ")}</StageChip>
                    <span className="text-xs font-medium uppercase tracking-[0.16em] text-slate-500">
                      {deal.dealType}
                    </span>
                  </div>
                  <h3 className="mt-3 text-lg font-semibold text-slate-950">
                    {deal.name}
                  </h3>
                  <p className="mt-1 text-sm text-slate-600">
                    {deal.borrower.name} | {deal.market}
                  </p>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                    {deal.summary}
                  </p>
                </div>
                <dl className="grid min-w-[220px] gap-3 text-sm text-slate-600">
                  <div>
                    <dt className="text-slate-500">Loan amount</dt>
                    <dd className="font-medium text-slate-900">
                      {currency(deal.loanAmount)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">Target close</dt>
                    <dd className="font-medium text-slate-900">
                      {shortDate(deal.targetCloseDate)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">Source</dt>
                    <dd className="font-medium text-slate-900">{deal.source}</dd>
                  </div>
                  <div>
                    <Link
                      className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-100"
                      href={`/deals/${deal.id}`}
                    >
                      Open workspace
                    </Link>
                  </div>
                </dl>
              </div>
            ))}
          </div>
        </Panel>

        <div className="grid gap-4">
          <Panel
            title="Demo flow"
            description="The current investor walkthrough now uses the internal lending workflow end to end."
          >
            <ol className="space-y-3 text-sm text-slate-600">
              <li className="rounded-[20px] border border-slate-200 bg-slate-50/70 p-4">
                <strong className="block text-slate-900">1. Start here</strong>
                Show the current mix of residential and CRE deals on the dashboard.
              </li>
              <li className="rounded-[20px] border border-slate-200 bg-slate-50/70 p-4">
                <strong className="block text-slate-900">2. Open lead intake</strong>
                Use a prefilled residential or CRE example so the demo moves quickly.
              </li>
              <li className="rounded-[20px] border border-slate-200 bg-slate-50/70 p-4">
                <strong className="block text-slate-900">3. Show the pipeline board</strong>
                Move the newly-created deal across stages with one obvious action.
              </li>
              <li className="rounded-[20px] border border-slate-200 bg-slate-50/70 p-4">
                <strong className="block text-slate-900">4. Open task center</strong>
                Show the daily work queue tied to real borrower and deal examples.
              </li>
              <li className="rounded-[20px] border border-slate-200 bg-slate-50/70 p-4">
                <strong className="block text-slate-900">5. Open the borrower workspace</strong>
                Show one deal in detail with borrower profile, snapshot, tasks, and documents in one place.
              </li>
              <li className="rounded-[20px] border border-slate-200 bg-slate-50/70 p-4">
                <strong className="block text-slate-900">6. Show document uploads</strong>
                Request a missing file, upload it locally, and return to the workspace.
              </li>
              <li className="rounded-[20px] border border-slate-200 bg-slate-50/70 p-4">
                <strong className="block text-slate-900">7. Open submission summary</strong>
                Show readiness, activity notes, and capital-source tracking in one handoff view.
              </li>
              <li className="rounded-[20px] border border-slate-200 bg-slate-50/70 p-4">
                <strong className="block text-slate-900">8. Open reports</strong>
                End with plain-language metrics on file health, submissions, and lender activity.
              </li>
            </ol>
          </Panel>

          <Panel
            title="Lead sources"
            description="Simple source tracking is enough for this first slice."
          >
            <div className="space-y-3">
              {sources.map(([source, count]) => (
                <div
                  key={source}
                  className="flex items-center justify-between rounded-[18px] border border-slate-200 bg-slate-50/70 px-4 py-3 text-sm"
                >
                  <span className="text-slate-600">{source}</span>
                  <strong className="text-slate-950">{count}</strong>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      </div>

      <div className="mt-4">
        <Panel
          title="Frequently asked questions"
          description="Built from the actual app flow so operators and investors can answer the common demo questions without guessing."
        >
          <div className="grid gap-3 xl:grid-cols-2">
            {dashboardFaqs.map((item) => (
              <details
                key={item.question}
                className="group rounded-[22px] border border-slate-200 bg-slate-50/70 p-4 open:bg-white"
              >
                <summary className="flex cursor-pointer list-none items-start justify-between gap-4 text-base font-semibold text-slate-950">
                  <span>{item.question}</span>
                  <span className="mt-0.5 text-lg leading-none text-slate-400 transition group-open:rotate-45 group-open:text-slate-700">
                    +
                  </span>
                </summary>
                <div className="mt-3 border-t border-slate-200 pt-3">
                  <p className="text-sm leading-6 text-slate-600">{item.answer}</p>
                  <Link
                    className="mt-3 inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-100"
                    href={item.href}
                  >
                    {item.linkLabel}
                  </Link>
                </div>
              </details>
            ))}
          </div>
        </Panel>
      </div>
    </AppFrame>
  );
}
