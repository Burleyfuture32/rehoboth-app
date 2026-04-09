import { AppFrame } from "@/components/app-frame";
import {
  MetricCard,
  PageHeader,
  Panel,
  PrimaryLink,
  SecondaryLink,
  StageChip,
} from "@/components/ui";
import { getLenderPortalPageData } from "@/lib/lender-portal";

export default async function LenderPortalPage() {
  const { lenders, metrics } = await getLenderPortalPageData();

  return (
    <AppFrame>
      <PageHeader
        eyebrow="Lender portal"
        title="A portal to the lenders Rehoboth actively uses"
        description="Keep lender fit, contact details, live file exposure, and program summaries in one place so the team can move from comparison to outreach without bouncing between screens."
        actions={
          <>
            <PrimaryLink href="/scenarios">Run scenarios</PrimaryLink>
            <SecondaryLink href="/capital-sources">Open capital sources</SecondaryLink>
            <SecondaryLink href="/ratesheets">Open full ratesheets</SecondaryLink>
          </>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Lenders tracked"
          value={`${metrics.lendersTracked}`}
          detail="Every lender with a saved ratesheet or live capital-source activity."
        />
        <MetricCard
          label="Programs tracked"
          value={`${metrics.programsTracked}`}
          detail="Program-level lender options currently kept in the MVP."
        />
        <MetricCard
          label="Live lender matches"
          value={`${metrics.liveMatches}`}
          detail="Active matches already tied to live files in capital sources."
        />
        <MetricCard
          label="Quotes received"
          value={`${metrics.quotesReceived}`}
          detail="Live files where a lender has already come back with pricing."
        />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.3fr)_minmax(320px,0.7fr)]">
        <div className="grid gap-4">
          {lenders.map((lender) => (
            <article
              key={lender.lenderName}
              className="rounded-[30px] border border-[color:var(--border-soft)] bg-[color:var(--surface)] p-5 shadow-[0_18px_50px_rgba(16,24,18,0.08)] backdrop-blur"
            >
              <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                <div className="max-w-3xl">
                  <div className="flex flex-wrap items-center gap-2">
                    {lender.dealTypes.map((dealType) => (
                      <StageChip key={`${lender.lenderName}-${dealType}`}>
                        {dealType}
                      </StageChip>
                    ))}
                    {lender.updatedAtLabel ? (
                      <span className="text-xs font-medium uppercase tracking-[0.16em] text-slate-500">
                        Updated {lender.updatedAtLabel}
                      </span>
                    ) : null}
                  </div>
                  <h2 className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-slate-950">
                    {lender.lenderName}
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {lender.contactName || "Contact not set"}
                    {lender.contactEmail ? ` | ${lender.contactEmail}` : ""}
                  </p>
                  {lender.propertyFocus.length > 0 ? (
                    <p className="mt-3 text-sm leading-6 text-slate-600">
                      {lender.propertyFocus.join(" | ")}
                    </p>
                  ) : null}
                  {lender.markets.length > 0 ? (
                    <p className="mt-2 text-sm leading-6 text-slate-500">
                      Markets: {lender.markets.join(" | ")}
                    </p>
                  ) : null}
                  {lender.notes[0] ? (
                    <p className="mt-3 text-sm leading-6 text-slate-600">
                      {lender.notes[0]}
                    </p>
                  ) : null}
                </div>

                <div className="grid gap-3 md:grid-cols-2 xl:min-w-[420px]">
                  <Metric label="Programs" value={`${lender.programs.length}`} />
                  <Metric label="Live files" value={`${lender.liveFiles.length}`} />
                  <Metric label="Quotes" value={`${lender.quoteCount}`} />
                  <Metric
                    label="Targeted / submitted"
                    value={`${lender.targetedCount} / ${lender.submittedCount}`}
                  />
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {lender.liveFiles.length > 0 ? (
                  lender.liveFiles.map((fileName) => (
                    <span
                      key={`${lender.lenderName}-${fileName}`}
                      className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700"
                    >
                      {fileName}
                    </span>
                  ))
                ) : (
                  <span className="rounded-full border border-dashed border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-500">
                    No live files attached yet
                  </span>
                )}
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {lender.programs.map((program) => (
                  <div
                    key={program.id}
                    className="rounded-[22px] border border-slate-200 bg-slate-50/70 p-4"
                  >
                    <p className="text-sm font-semibold text-slate-950">{program.name}</p>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      {program.rateRange} | {program.maxLeverage}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-slate-500">
                      {program.termOptions} | {program.recourse}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-slate-500">
                      Turn time: {program.turnTime}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-4 flex flex-wrap gap-3">
                {lender.contactEmail ? (
                  <PrimaryLink
                    href={`mailto:${lender.contactEmail}?subject=${encodeURIComponent(`Rehoboth lending inquiry - ${lender.lenderName}`)}`}
                  >
                    Email lender
                  </PrimaryLink>
                ) : null}
                <SecondaryLink href="/capital-sources">View live matches</SecondaryLink>
                <SecondaryLink href="/ratesheets">Open ratesheets</SecondaryLink>
              </div>
            </article>
          ))}
        </div>

        <div className="grid gap-4">
          <Panel
            title="How to use this tab"
            description="This page is meant to be the fast starting point before you touch a live file."
          >
            <div className="space-y-3 text-sm leading-6 text-slate-600">
              <PortalChecklistItem text="Start here when you need a quick reminder of lender fit, pricing posture, and the right contact." />
              <PortalChecklistItem text="Open the scenarios desk when you want to pressure-test one file across every lender you use." />
              <PortalChecklistItem text="Use capital sources for live file execution after you narrow the field here." />
              <PortalChecklistItem text="Use ratesheets when you need the full comparison view across all saved programs." />
            </div>
          </Panel>

          <Panel
            title="What this portal solves"
            description="Keep the lender workflow obvious for low-tech internal users."
          >
            <p className="text-sm leading-6 text-slate-600">
              Instead of making users remember whether lender details live in notes,
              ratesheets, or a deal record, this tab gives one clear lender doorway with
              contact info, current programs, and live deal exposure together.
            </p>
          </Panel>

          <Panel
            title="Current posture"
            description="This stays honest about the MVP scope."
          >
            <p className="text-sm leading-6 text-slate-600">
              This portal is internal. It organizes the lenders Rehoboth uses and links
              the team back into capital sources and ratesheets. If you want direct lender
              login URLs next, those can be wired in once the real portal links are
              available.
            </p>
          </Panel>
        </div>
      </div>
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

function PortalChecklistItem({ text }: { text: string }) {
  return (
    <div className="rounded-[18px] border border-slate-200 bg-slate-50/75 px-4 py-3 text-sm leading-6 text-slate-600">
      {text}
    </div>
  );
}
