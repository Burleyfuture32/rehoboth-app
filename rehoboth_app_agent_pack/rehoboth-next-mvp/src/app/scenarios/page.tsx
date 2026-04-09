import { AppFrame } from "@/components/app-frame";
import {
  MetricCard,
  PageHeader,
  Panel,
  PrimaryLink,
  SecondaryLink,
  StageChip,
} from "@/components/ui";
import { getScenarioDeskData, scenarioPresets } from "@/lib/scenarios";

function readSearchParam(source: string | string[] | undefined) {
  return Array.isArray(source) ? source[0] : source;
}

function buildPresetHref(values: Record<string, string>) {
  const params = new URLSearchParams(values);
  return `/scenarios?${params.toString()}`;
}

export default async function ScenariosDeskPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const { scenario, comparisons, metrics } = await getScenarioDeskData({
    scenarioName: readSearchParam(params.scenarioName),
    dealType: readSearchParam(params.dealType),
    loanAmount: readSearchParam(params.loanAmount),
    leverage: readSearchParam(params.leverage),
    dscr: readSearchParam(params.dscr),
    fico: readSearchParam(params.fico),
    market: readSearchParam(params.market),
    propertyType: readSearchParam(params.propertyType),
  });

  const topFits = comparisons.slice(0, 3);

  return (
    <AppFrame>
      <PageHeader
        eyebrow="Scenarios desk"
        title="Run a lending scenario and compare it across your lender set"
        description="Use one scenario form to pressure-test fit, leverage, pricing posture, and lender requirements before you decide who should see the file."
        actions={
          <>
            <PrimaryLink href="/lender-portal">Open lender portal</PrimaryLink>
            <SecondaryLink href="/ratesheets">Open ratesheets</SecondaryLink>
          </>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Programs compared"
          value={`${metrics.comparedPrograms}`}
          detail="Every saved lender program is scored against the current scenario."
        />
        <MetricCard
          label="Strong fits"
          value={`${metrics.strongFits}`}
          detail="Programs that line up cleanly with the core requirements."
        />
        <MetricCard
          label="Viable fits"
          value={`${metrics.viableFits}`}
          detail="Programs that still look usable once conditional issues are considered."
        />
        <MetricCard
          label="Best visible pricing"
          value={metrics.lowestRateLabel}
          detail={`Fastest visible turn time: ${metrics.fastestTurnLabel}`}
        />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(340px,0.9fr)]">
        <Panel
          title="Scenario inputs"
          description="Keep the scenario narrow and operational so the lender comparison stays useful."
        >
          <form className="grid gap-4" method="get">
            <div className="grid gap-4 md:grid-cols-2">
              <Field
                defaultValue={scenario.scenarioName}
                label="Scenario name"
                name="scenarioName"
                placeholder="Southeast CRE bridge"
              />
              <SelectField
                defaultValue={scenario.dealType}
                label="Deal type"
                name="dealType"
                options={[
                  { label: "CRE", value: "CRE" },
                  { label: "Residential", value: "RESIDENTIAL" },
                ]}
              />
              <Field
                defaultValue={`${scenario.loanAmount}`}
                label="Loan amount"
                name="loanAmount"
                placeholder="1850000"
                type="number"
              />
              <Field
                defaultValue={`${scenario.leverage}`}
                label="Requested leverage (%)"
                name="leverage"
                placeholder="70"
                type="number"
              />
              <Field
                defaultValue={scenario.dscr?.toString() ?? ""}
                label="Scenario DSCR"
                name="dscr"
                placeholder="1.25"
                step="0.01"
                type="number"
              />
              <Field
                defaultValue={scenario.fico?.toString() ?? ""}
                label="Scenario FICO"
                name="fico"
                placeholder="700"
                type="number"
              />
              <Field
                defaultValue={scenario.market}
                label="Market"
                name="market"
                placeholder="Georgia"
              />
              <Field
                defaultValue={scenario.propertyType}
                label="Property type or use"
                name="propertyType"
                placeholder="mixed-use commercial"
              />
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                className="inline-flex items-center justify-center rounded-full bg-[var(--brand-green)] px-5 py-3 text-sm font-medium text-white shadow-[0_10px_24px_rgba(31,143,47,0.22)] transition hover:bg-[var(--brand-green-deep)]"
                type="submit"
              >
                Run scenario
              </button>
              <a
                className="inline-flex items-center justify-center rounded-full border border-[color:var(--border-soft)] bg-white px-5 py-3 text-sm font-medium text-slate-700 transition hover:border-[var(--brand-silver)] hover:bg-[color:var(--surface-muted)]"
                href="/scenarios"
              >
                Reset
              </a>
            </div>
          </form>
        </Panel>

        <div className="grid gap-4">
          <Panel
            title="Sample scenarios"
            description="Quick-start examples tied to the lender mix already seeded in the app."
          >
            <div className="space-y-3">
              {scenarioPresets.map((preset) => (
                <a
                  key={preset.label}
                  className="block rounded-[20px] border border-slate-200 bg-slate-50/70 p-4 transition hover:border-slate-300 hover:bg-white"
                  href={buildPresetHref(preset.values)}
                >
                  <p className="text-sm font-semibold text-slate-950">{preset.label}</p>
                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    {preset.description}
                  </p>
                </a>
              ))}
            </div>
          </Panel>

          <Panel
            title="Current scenario"
            description="This snapshot explains what the comparison engine is judging."
          >
            <div className="flex flex-wrap gap-2">
              <StageChip>{scenario.dealType}</StageChip>
              <Tag>{scenario.market}</Tag>
              <Tag>{scenario.propertyType}</Tag>
              <Tag>{`$${scenario.loanAmount.toLocaleString("en-US")}`}</Tag>
              <Tag>{`${scenario.leverage}% leverage`}</Tag>
              {scenario.dscr !== null ? <Tag>{`${scenario.dscr.toFixed(2)} DSCR`}</Tag> : null}
              {scenario.fico !== null ? <Tag>{`${Math.round(scenario.fico)} FICO`}</Tag> : null}
            </div>
          </Panel>
        </div>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
        <div className="grid gap-4">
          <Panel
            title="Ranked comparison"
            description="Programs are ranked by basic fit, requirement clearance, and whether the lender is already active in the workspace."
          >
            <div className="space-y-4">
              {comparisons.map((comparison) => (
                <article
                  key={comparison.id}
                  className="rounded-[24px] border border-slate-200 bg-slate-50/70 p-4"
                >
                  <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                    <div className="max-w-3xl">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] ${comparison.fitTone}`}
                        >
                          {comparison.fitLabel}
                        </span>
                        <span className="text-xs font-medium uppercase tracking-[0.16em] text-slate-500">
                          Score {comparison.fitScore}
                        </span>
                        <span className="text-xs font-medium uppercase tracking-[0.16em] text-slate-500">
                          Updated {comparison.updatedAtLabel}
                        </span>
                      </div>
                      <h2 className="mt-3 text-xl font-semibold text-slate-950">
                        {comparison.lenderName}
                      </h2>
                      <p className="mt-1 text-sm font-medium text-slate-700">
                        {comparison.programName}
                      </p>
                      <p className="mt-3 text-sm leading-6 text-slate-600">
                        {comparison.propertyFocus} | {comparison.markets}
                      </p>
                    </div>

                    <div className="grid gap-3 md:grid-cols-2 xl:min-w-[420px]">
                      <Metric label="Loan range" value={comparison.loanRangeLabel} />
                      <Metric label="Rate range" value={comparison.rateRange} />
                      <Metric label="Max leverage" value={comparison.maxLeverage} />
                      <Metric
                        label="Min DSCR / FICO"
                        value={`${comparison.minDscr} / ${comparison.minFico}`}
                      />
                      <Metric label="Term options" value={comparison.termOptions} />
                      <Metric
                        label="Turn time / live files"
                        value={`${comparison.turnTime} | ${comparison.liveMatchCount}`}
                      />
                    </div>
                  </div>

                  <div className="mt-4 grid gap-4 lg:grid-cols-2">
                    <div className="rounded-[20px] border border-emerald-100 bg-emerald-50/70 p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-800">
                        Why it fits
                      </p>
                      <div className="mt-3 space-y-2">
                        {comparison.matchedReasons.length > 0 ? (
                          comparison.matchedReasons.slice(0, 3).map((reason) => (
                            <ReasonRow key={`${comparison.id}-${reason}`} text={reason} />
                          ))
                        ) : (
                          <ReasonRow text="No obvious advantages were found from the listed criteria." />
                        )}
                      </div>
                    </div>

                    <div className="rounded-[20px] border border-amber-100 bg-amber-50/70 p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-amber-800">
                        Watchouts
                      </p>
                      <div className="mt-3 space-y-2">
                        {comparison.watchouts.length > 0 ? (
                          comparison.watchouts.slice(0, 3).map((watchout) => (
                            <ReasonRow key={`${comparison.id}-${watchout}`} text={watchout} />
                          ))
                        ) : (
                          <ReasonRow text="No obvious requirement gaps showed up against the saved ratesheet." />
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-3">
                    <a
                      className="inline-flex items-center justify-center rounded-full bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800"
                      href={`mailto:${comparison.contactEmail}?subject=${encodeURIComponent(`Scenario review - ${scenario.scenarioName}`)}`}
                    >
                      Email {comparison.contactName}
                    </a>
                    <SecondaryLink href="/lender-portal">Back to lender portal</SecondaryLink>
                  </div>
                </article>
              ))}
            </div>
          </Panel>
        </div>

        <div className="grid gap-4">
          <Panel
            title="Top calls"
            description="Fast readout for whoever is deciding where the file should go first."
          >
            <div className="space-y-3">
              {topFits.map((comparison, index) => (
                <div
                  key={comparison.id}
                  className="rounded-[20px] border border-slate-200 bg-slate-50/70 p-4"
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                    Option {index + 1}
                  </p>
                  <p className="mt-2 text-base font-semibold text-slate-950">
                    {comparison.lenderName}
                  </p>
                  <p className="mt-1 text-sm text-slate-600">{comparison.programName}</p>
                  <p className="mt-3 text-sm leading-6 text-slate-600">
                    {comparison.fitLabel} at score {comparison.fitScore}.{" "}
                    {comparison.matchedReasons[0] ?? "Review the requirements before outreach."}
                  </p>
                </div>
              ))}
            </div>
          </Panel>

          <Panel
            title="How scoring works"
            description="This is a practical shortlist tool, not automated underwriting."
          >
            <div className="space-y-3 text-sm leading-6 text-slate-600">
              <ReasonRow text="The desk scores deal type, loan amount, leverage, DSCR, FICO, market fit, property focus, and whether the lender is already live in the workspace." />
              <ReasonRow text="Rates, terms, and turn time are displayed side by side so you can compare tradeoffs after fit is established." />
              <ReasonRow text="Use this to decide who gets the first look, then move into Capital Sources for live execution." />
            </div>
          </Panel>
        </div>
      </div>
    </AppFrame>
  );
}

function Field({
  defaultValue,
  label,
  name,
  placeholder,
  type = "text",
  step,
}: {
  defaultValue: string;
  label: string;
  name: string;
  placeholder: string;
  type?: string;
  step?: string;
}) {
  return (
    <label className="grid gap-2 text-sm">
      <span className="font-medium text-slate-700">{label}</span>
      <input
        className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-emerald-400"
        defaultValue={defaultValue}
        name={name}
        placeholder={placeholder}
        step={step}
        type={type}
      />
    </label>
  );
}

function SelectField({
  defaultValue,
  label,
  name,
  options,
}: {
  defaultValue: string;
  label: string;
  name: string;
  options: Array<{ label: string; value: string }>;
}) {
  return (
    <label className="grid gap-2 text-sm">
      <span className="font-medium text-slate-700">{label}</span>
      <select
        className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-emerald-400"
        defaultValue={defaultValue}
        name={name}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
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

function ReasonRow({ text }: { text: string }) {
  return (
    <div className="rounded-[16px] border border-white/70 bg-white/80 px-3 py-2 text-sm leading-6 text-slate-700">
      {text}
    </div>
  );
}

function Tag({ children }: { children: string }) {
  return (
    <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700">
      {children}
    </span>
  );
}
