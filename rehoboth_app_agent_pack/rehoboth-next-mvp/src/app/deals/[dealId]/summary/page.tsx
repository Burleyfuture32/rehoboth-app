import {
  CapitalSourceStatus,
  StatusTrackerStatus,
  SubmissionStatus,
} from "@prisma/client";
import { notFound } from "next/navigation";
import {
  addCapitalSourceAction,
  addDealActivityAction,
  saveSubmissionSummaryAction,
  updateCapitalSourceAction,
} from "@/app/actions";
import { AppFrame } from "@/components/app-frame";
import { ClientStatusBar } from "@/components/client-status-bar";
import { DealTabs } from "@/components/deal-tabs";
import {
  PageHeader,
  Panel,
  PrimaryLink,
  SecondaryLink,
  StageChip,
} from "@/components/ui";
import { shortDate } from "@/lib/format";
import { getDealSummaryData } from "@/lib/deal-summary";
import {
  formatStatusTrackerValue,
  getStatusTrackerLabel,
  getStatusTrackerPageData,
  getStatusTrackerTone,
} from "@/lib/status-tracker";

const submissionTone = {
  NOT_READY: "bg-rose-50 text-rose-800",
  READY_TO_SUBMIT: "bg-amber-50 text-amber-800",
  SUBMITTED: "bg-emerald-50 text-emerald-800",
} as const;

const capitalTone = {
  TARGETED: "bg-slate-100 text-slate-700",
  SUBMITTED: "bg-amber-50 text-amber-800",
  QUOTE_RECEIVED: "bg-emerald-50 text-emerald-800",
  PASSED: "bg-rose-50 text-rose-800",
} as const;

const signalTone = {
  good: "border-emerald-200 bg-emerald-50 text-emerald-900",
  warn: "border-amber-200 bg-amber-50 text-amber-900",
  neutral: "border-slate-200 bg-slate-50 text-slate-700",
} as const;

export default async function DealSummaryPage({
  params,
  searchParams,
}: {
  params: Promise<{ dealId: string }>;
  searchParams: Promise<{ saved?: string; capital?: string; activity?: string }>;
}) {
  const [{ dealId }, pageParams] = await Promise.all([params, searchParams]);
  const [summary, trackerData] = await Promise.all([
    getDealSummaryData(dealId),
    getStatusTrackerPageData(dealId),
  ]);

  if (!summary || !trackerData) {
    notFound();
  }

  const {
    deal,
    missingItems,
    openTasks,
    readinessSignals,
    recommendedStatus,
    requestedDocuments,
  } = summary;
  const submissionStatus =
    deal.loanFile?.submissionStatus ?? SubmissionStatus.NOT_READY;

  return (
    <AppFrame>
      <PageHeader
        eyebrow="Submission summary"
        title={`${deal.borrower.name} lender handoff`}
        description="This page turns the live file into an actual handoff decision: are we ready to submit, who should see it, and what happened on the file recently."
        actions={
          <>
            <PrimaryLink href={`/deals/${deal.id}`}>Back to workspace</PrimaryLink>
            <SecondaryLink href={`/deals/${deal.id}/file`}>
              Open client file
            </SecondaryLink>
            <SecondaryLink href={`/deals/${deal.id}/communications`}>
              Open communications
            </SecondaryLink>
            <SecondaryLink href={`/deals/${deal.id}/status-tracker`}>
              Open status tracker
            </SecondaryLink>
            <SecondaryLink href={`/documents?dealId=${deal.id}`}>
              Open documents
            </SecondaryLink>
          </>
        }
      />

      <ClientStatusBar deal={deal} />
      <DealTabs current="summary" dealId={deal.id} />

      {pageParams.saved || pageParams.capital || pageParams.activity ? (
        <div className="mb-6 rounded-[24px] border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-900">
          Summary updates saved.
        </div>
      ) : null}

      <div className="mb-4 grid gap-4 md:grid-cols-4">
        <SummaryTile label="Stage" value={deal.stage.replaceAll("_", " ")} />
        <SummaryTile label="Open tasks" value={`${openTasks.length}`} />
        <SummaryTile
          label="Requested docs"
          value={`${requestedDocuments.length}`}
        />
        <SummaryTile
          label="Capital sources"
          value={`${deal.capitalSources.length}`}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
        <Panel
          title="Submission readiness"
          description="One obvious answer for the team: not ready, ready to submit, or already out with lenders."
          action={
            <span
              className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] ${submissionTone[submissionStatus]}`}
            >
              {submissionStatus.replaceAll("_", " ")}
            </span>
          }
        >
          <form action={saveSubmissionSummaryAction} className="grid gap-4">
            <input name="dealId" type="hidden" value={deal.id} />
            <input
              name="returnTo"
              type="hidden"
              value={`/deals/${deal.id}/summary?saved=1`}
            />

            <div className="rounded-[20px] border border-slate-200 bg-slate-50/80 p-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  System check
                </span>
                <span
                  className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] ${submissionTone[recommendedStatus]}`}
                >
                  {recommendedStatus.replaceAll("_", " ")}
                </span>
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                This recommendation comes from open tasks, requested documents, and
                live lender activity. Keep the manual status when you need to
                override the system check during the demo.
              </p>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {readinessSignals.map((signal) => (
                  <div
                    key={signal.label}
                    className={`rounded-[18px] border px-4 py-3 ${signalTone[signal.state]}`}
                  >
                    <p className="text-xs font-semibold uppercase tracking-[0.16em]">
                      {signal.label}
                    </p>
                    <p className="mt-2 text-sm font-medium">{signal.value}</p>
                  </div>
                ))}
              </div>
            </div>

            <SelectField
              defaultValue={submissionStatus}
              label="Submission status"
              name="submissionStatus"
              options={Object.values(SubmissionStatus)}
            />

            <TextAreaField
              defaultValue={deal.loanFile?.recommendedAction ?? ""}
              label="Recommended next action"
              minHeight="min-h-24"
              name="recommendedAction"
            />

            <TextAreaField
              defaultValue={deal.loanFile?.submissionNotes ?? ""}
              label="Submission notes"
              minHeight="min-h-28"
              name="submissionNotes"
            />

            <TextAreaField
              defaultValue={deal.loanFile?.missingItemsSummary ?? ""}
              label="Manual missing items summary"
              minHeight="min-h-24"
              name="missingItemsSummary"
            />

            <button
              className="inline-flex items-center justify-center rounded-full bg-[var(--brand-green)] px-5 py-3 text-sm font-medium text-white shadow-[0_10px_24px_rgba(31,143,47,0.22)] transition hover:bg-[var(--brand-green-deep)]"
              type="submit"
            >
              Save submission summary
            </button>
          </form>
        </Panel>

        <Panel
          title="What is still missing"
          description="This combines manual file notes with live open tasks and requested documents."
          action={<StageChip>{deal.dealType}</StageChip>}
        >
          <div className="space-y-3">
            {missingItems.length === 0 ? (
              <div className="rounded-[18px] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
                Nothing obvious is missing right now.
              </div>
            ) : (
              missingItems.map((item, index) => (
                <div
                  key={`${item}-${index}`}
                  className="rounded-[18px] border border-slate-200 bg-slate-50/70 px-4 py-3 text-sm text-slate-700"
                >
                  {item}
                </div>
              ))
            )}
          </div>
        </Panel>
      </div>

      <div className="mt-4">
        <Panel
          title="Simplified checkpoint checklist"
          description="Every checkpoint is listed in one place so the team can see what is left to do without opening each tracker section."
          action={
            <SecondaryLink href={`/deals/${deal.id}/status-tracker`}>
              Open full tracker
            </SecondaryLink>
          }
        >
          <div className="mb-4 grid gap-3 md:grid-cols-3 xl:grid-cols-5">
            <SummaryTile
              label="Complete"
              value={`${trackerData.summary.completedSections}`}
            />
            <SummaryTile
              label="In progress"
              value={`${trackerData.summary.inProgressSections}`}
            />
            <SummaryTile
              label="Pending"
              value={`${trackerData.summary.pendingSections}`}
            />
            <SummaryTile
              label="Overdue"
              value={`${trackerData.summary.overdueSectionsCount}`}
            />
            <SummaryTile
              label="Still to do"
              value={`${
                trackerData.summary.totalSections -
                trackerData.summary.completedSections
              }`}
            />
          </div>

          <div className="space-y-3">
            {trackerData.sections.map((section) => (
              <article
                key={section.id}
                className="rounded-[22px] border border-slate-200 bg-slate-50/70 p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] ${getStatusTrackerTone(section.status)}`}
                      >
                        {formatStatusTrackerValue(section.status)}
                      </span>
                      {section.isOverdue ? (
                        <span className="inline-flex rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-rose-800">
                          Overdue
                        </span>
                      ) : null}
                    </div>

                    <h3 className="mt-3 text-base font-semibold text-slate-950">
                      {getStatusTrackerLabel(section.sectionKey)}
                    </h3>
                    <p className="mt-1 text-sm text-slate-500">
                      {section.personOrCompanyName ?? "Unassigned"} |{" "}
                      {section.assignedToName ?? "No owner assigned"}
                    </p>
                  </div>

                  <div className="min-w-[160px] text-sm text-slate-600">
                    <p>
                      Due: {section.dueDate ? shortDate(section.dueDate) : "Not set"}
                    </p>
                    <p className="mt-1">{section.percentComplete}% complete</p>
                  </div>
                </div>

                <p className="mt-3 text-sm leading-6 text-slate-600">
                  {section.blockerReason ??
                    section.notes ??
                    (section.status === StatusTrackerStatus.COMPLETE
                      ? "Checkpoint complete."
                      : "No detail logged yet.")}
                </p>
              </article>
            ))}
          </div>
        </Panel>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
        <Panel
          title="Capital sources"
          description="Track which lenders or capital partners fit the file without building a full marketplace."
          action={<SecondaryLink href="/ratesheets">View ratesheets</SecondaryLink>}
        >
          <form action={addCapitalSourceAction} className="grid gap-4">
            <input name="dealId" type="hidden" value={deal.id} />
            <input
              name="returnTo"
              type="hidden"
              value={`/deals/${deal.id}/summary?capital=1`}
            />
            <div className="grid gap-4 xl:grid-cols-2">
              <Field label="Lender / source" name="lenderName" />
              <Field label="Program" name="program" />
              <SelectField
                label="Status"
                name="status"
                options={Object.values(CapitalSourceStatus)}
              />
              <Field label="Quote amount" name="quoteAmount" required={false} />
              <Field label="Leverage" name="leverage" required={false} />
              <Field label="Rate" name="rate" required={false} />
            </div>
            <TextAreaField
              defaultValue=""
              label="Notes"
              minHeight="min-h-24"
              name="notes"
            />
            <div>
              <button
                className="inline-flex items-center justify-center rounded-full bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-700"
                type="submit"
              >
                Add capital source
              </button>
            </div>
          </form>

          <div className="mt-4 space-y-3">
            {deal.capitalSources.length === 0 ? (
              <div className="rounded-[20px] border border-dashed border-slate-200 bg-slate-50/60 px-4 py-6 text-sm text-slate-500">
                No capital sources tracked yet.
              </div>
            ) : null}

            {deal.capitalSources.map((source) => (
              <article
                key={source.id}
                className="rounded-[22px] border border-slate-200 bg-slate-50/70 p-4"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] ${capitalTone[source.status]}`}
                  >
                    {source.status.replaceAll("_", " ")}
                  </span>
                  <span className="text-xs font-medium uppercase tracking-[0.16em] text-slate-500">
                    {source.program}
                  </span>
                </div>
                <h3 className="mt-3 text-base font-semibold text-slate-950">
                  {source.lenderName}
                </h3>
                <div className="mt-3 grid gap-3 text-sm md:grid-cols-3">
                  <DetailItem label="Quote amount" value={source.quoteAmount ?? "-"} />
                  <DetailItem label="Leverage" value={source.leverage ?? "-"} />
                  <DetailItem label="Rate" value={source.rate ?? "-"} />
                </div>
                {source.notes ? (
                  <p className="mt-3 text-sm leading-6 text-slate-600">{source.notes}</p>
                ) : null}

                <form
                  action={updateCapitalSourceAction}
                  className="mt-4 grid gap-4 rounded-[20px] border border-slate-200 bg-white p-4"
                >
                  <input name="matchId" type="hidden" value={source.id} />
                  <input
                    name="returnTo"
                    type="hidden"
                    value={`/deals/${deal.id}/summary?capital=1`}
                  />
                  <div className="grid gap-4 xl:grid-cols-2">
                    <SelectField
                      defaultValue={source.status}
                      label="Status"
                      name="status"
                      options={Object.values(CapitalSourceStatus)}
                    />
                    <Field
                      defaultValue={source.quoteAmount ?? ""}
                      label="Quote amount"
                      name="quoteAmount"
                      required={false}
                    />
                    <Field
                      defaultValue={source.leverage ?? ""}
                      label="Leverage"
                      name="leverage"
                      required={false}
                    />
                    <Field
                      defaultValue={source.rate ?? ""}
                      label="Rate"
                      name="rate"
                      required={false}
                    />
                  </div>
                  <TextAreaField
                    defaultValue={source.notes ?? ""}
                    label="Update notes"
                    minHeight="min-h-20"
                    name="notes"
                  />
                  <div className="flex flex-wrap gap-3">
                    <button
                      className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-100"
                      type="submit"
                    >
                      Save lender update
                    </button>
                    <SecondaryLink href="/ratesheets">Open ratesheets</SecondaryLink>
                  </div>
                </form>
              </article>
            ))}
          </div>
        </Panel>

        <Panel
          title="Activity history"
          description="A simple note log is enough for MVP as long as it stays tied to the file."
        >
          <form action={addDealActivityAction} className="grid gap-4">
            <input name="dealId" type="hidden" value={deal.id} />
            <input
              name="returnTo"
              type="hidden"
              value={`/deals/${deal.id}/summary?activity=1`}
            />
            <Field label="Activity title" name="title" />
            <Field defaultValue="Avery Shaw" label="Created by" name="createdBy" />
            <TextAreaField
              defaultValue=""
              label="What happened"
              minHeight="min-h-24"
              name="body"
            />
            <div>
              <button
                className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-100"
                type="submit"
              >
                Add activity note
              </button>
            </div>
          </form>

          <div className="mt-4 space-y-3">
            {deal.activities.map((activity) => (
              <article
                key={activity.id}
                className="rounded-[22px] border border-slate-200 bg-slate-50/70 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-base font-semibold text-slate-950">
                      {activity.title}
                    </h3>
                    <p className="mt-1 text-sm text-slate-500">
                      {activity.createdBy} | {shortDate(activity.createdAt)}
                    </p>
                  </div>
                  <StageChip>{activity.kind}</StageChip>
                </div>
                <p className="mt-3 text-sm leading-6 text-slate-600">{activity.body}</p>
              </article>
            ))}
          </div>
        </Panel>
      </div>
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

function Field({
  label,
  name,
  defaultValue,
  required,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  required?: boolean;
}) {
  return (
    <label className="grid gap-2 text-sm">
      <span className="font-medium text-slate-700">{label}</span>
      <input
        className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-emerald-400"
        defaultValue={defaultValue}
        name={name}
        required={required ?? true}
      />
    </label>
  );
}

function SelectField({
  label,
  name,
  options,
  defaultValue,
}: {
  label: string;
  name: string;
  options: string[];
  defaultValue?: string;
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
          <option key={option} value={option}>
            {option.replaceAll("_", " ")}
          </option>
        ))}
      </select>
    </label>
  );
}

function TextAreaField({
  label,
  name,
  defaultValue,
  minHeight,
}: {
  label: string;
  name: string;
  defaultValue: string;
  minHeight: string;
}) {
  return (
    <label className="grid gap-2 text-sm">
      <span className="font-medium text-slate-700">{label}</span>
      <textarea
        className={`${minHeight} rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-emerald-400`}
        defaultValue={defaultValue}
        name={name}
      />
    </label>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[18px] border border-slate-200 bg-white px-4 py-3">
      <p className="text-xs uppercase tracking-[0.16em] text-slate-500">{label}</p>
      <p className="mt-2 font-medium text-slate-900">{value}</p>
    </div>
  );
}
