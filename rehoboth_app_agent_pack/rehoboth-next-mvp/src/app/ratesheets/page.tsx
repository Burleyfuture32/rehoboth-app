import { AppFrame } from "@/components/app-frame";
import {
  PageHeader,
  Panel,
  PrimaryLink,
  SecondaryLink,
  StageChip,
} from "@/components/ui";
import { getRatesheetsPageData } from "@/lib/ratesheets";

export default async function RatesheetsPage() {
  const { counts, ratesheets } = await getRatesheetsPageData();

  return (
    <AppFrame>
      <PageHeader
        eyebrow="Lender ratesheets"
        title="A simple directory of lender pricing and appetite"
        description="This gives the team one place to compare program fit, rough pricing, leverage, and contacts before updating a live capital-source record."
        actions={
          <>
            <PrimaryLink href="/scenarios">Run scenarios</PrimaryLink>
            <SecondaryLink href="/capital-sources">Back to capital sources</SecondaryLink>
          </>
        }
      />

      <div className="mb-4 grid gap-4 md:grid-cols-3">
        <SummaryTile label="Ratesheets tracked" value={`${counts.total}`} />
        <SummaryTile label="CRE programs" value={`${counts.cre}`} />
        <SummaryTile label="Residential programs" value={`${counts.residential}`} />
      </div>

      <Panel
        title="Available lender programs"
        description="Keep this obvious for low-tech users: lender, fit, rate range, leverage, and contact in one place."
      >
        <div className="space-y-3">
          {ratesheets.map((sheet) => (
            <article
              key={sheet.id}
              className="rounded-[22px] border border-slate-200 bg-slate-50/70 p-4"
            >
              <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                <div className="max-w-2xl">
                  <div className="flex flex-wrap items-center gap-2">
                    <StageChip>{sheet.dealTypes}</StageChip>
                    <span className="text-xs font-medium uppercase tracking-[0.16em] text-slate-500">
                      Updated {sheet.updatedAtLabel}
                    </span>
                  </div>
                  <h3 className="mt-3 text-lg font-semibold text-slate-950">
                    {sheet.lenderName}
                  </h3>
                  <p className="mt-1 text-sm font-medium text-slate-700">
                    {sheet.programName}
                  </p>
                  <p className="mt-3 text-sm leading-6 text-slate-600">
                    {sheet.propertyFocus} | {sheet.markets}
                  </p>
                  {sheet.notes ? (
                    <p className="mt-3 text-sm leading-6 text-slate-600">{sheet.notes}</p>
                  ) : null}
                </div>

                <div className="grid gap-3 md:grid-cols-2 xl:min-w-[460px]">
                  <Metric
                    label="Loan amount"
                    value={`${sheet.minLoanAmount} to ${sheet.maxLoanAmount}`}
                  />
                  <Metric label="Rate range" value={sheet.rateRange} />
                  <Metric label="Max leverage" value={sheet.maxLeverage} />
                  <Metric label="Term options" value={sheet.termOptions} />
                  <Metric
                    label="DSCR / FICO"
                    value={`${sheet.minDscr ?? "-"} / ${sheet.minFico ?? "-"}`}
                  />
                  <Metric
                    label="Recourse / turn time"
                    value={`${sheet.recourse} | ${sheet.turnTime}`}
                  />
                </div>
              </div>

              <div className="mt-4 rounded-[18px] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
                <span className="font-medium text-slate-900">{sheet.contactName}</span>
                <span className="mx-2 text-slate-300">|</span>
                <span>{sheet.contactEmail}</span>
              </div>
            </article>
          ))}
        </div>
      </Panel>
    </AppFrame>
  );
}

function SummaryTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[20px] border border-slate-200 bg-slate-50/70 p-4">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-2 text-lg font-semibold text-slate-950">{value}</p>
    </div>
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
