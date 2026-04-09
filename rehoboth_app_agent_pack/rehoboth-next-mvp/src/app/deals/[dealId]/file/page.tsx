import { TaskPriority } from "@prisma/client";
import { notFound } from "next/navigation";
import { completeTaskAction, createTaskAction, saveLoanFileAction } from "@/app/actions";
import { AppFrame } from "@/components/app-frame";
import { ClientStatusBar } from "@/components/client-status-bar";
import { DealTabs } from "@/components/deal-tabs";
import { PinToQuickManagerButton } from "@/components/pin-to-quick-manager-button";
import {
  PageHeader,
  Panel,
  PrimaryLink,
  SecondaryLink,
  StageChip,
} from "@/components/ui";
import { shortDate } from "@/lib/format";
import { getClientFileData } from "@/lib/client-file";

export default async function ClientFilePage({
  params,
  searchParams,
}: {
  params: Promise<{ dealId: string }>;
  searchParams: Promise<{ saved?: string; taskSaved?: string; taskDone?: string }>;
}) {
  const [{ dealId }, pageParams] = await Promise.all([params, searchParams]);
  const deal = await getClientFileData(dealId);

  if (!deal) {
    notFound();
  }

  const loanFile = deal.loanFile;
  const openTasks = deal.tasks.filter((task) => task.status === "OPEN").length;
  const doneTasks = deal.tasks.filter((task) => task.status === "DONE").length;
  const overdueTasks = deal.overdueTaskCount;
  const requestedDocuments = deal.documentRequests.filter(
    (document) => document.status === "REQUESTED",
  ).length;

  return (
    <AppFrame>
      <PageHeader
        eyebrow="Client file"
        title={`${deal.borrower.name} full file`}
        description="This is the deep-dive record for one client. It keeps the full lifecycle of the loan in one place, from intake through underwriting, closing, and post-close follow-up."
        actions={
          <>
            <PinToQuickManagerButton
              item={{
                id: `pin-client-file-${deal.id}`,
                label: `${deal.borrower.name} client file`,
                href: `/deals/${deal.id}/file`,
                category: "FILE",
                note: deal.name,
              }}
            />
            <PrimaryLink href={`/deals/${deal.id}`}>Back to workspace</PrimaryLink>
            <SecondaryLink href={`/deals/${deal.id}/summary`}>
              Open submission summary
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
      <DealTabs current="file" dealId={deal.id} />

      {pageParams.saved ? (
        <div className="mb-6 rounded-[24px] border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-900">
          Client file saved.
        </div>
      ) : null}

      {pageParams.taskSaved ? (
        <div className="mb-6 rounded-[24px] border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-900">
          Task added to the client file.
        </div>
      ) : null}

      {pageParams.taskDone ? (
        <div className="mb-6 rounded-[24px] border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-900">
          Task marked complete.
        </div>
      ) : null}

      <div className="mb-4 grid gap-4 md:grid-cols-4">
        <SummaryTile label="Deal stage" value={deal.stage.replaceAll("_", " ")} />
        <SummaryTile label="Open tasks" value={`${openTasks}`} />
        <SummaryTile label="Requested docs" value={`${requestedDocuments}`} />
        <SummaryTile label="Deal type" value={deal.dealType} />
      </div>

      <form action={saveLoanFileAction} className="grid gap-4">
        <input name="dealId" type="hidden" value={deal.id} />
        <input name="returnTo" type="hidden" value={`/deals/${deal.id}/file?saved=1`} />

        <Panel
          title="File header"
          description="Keep the top of the file simple and easy to scan."
          action={<StageChip>{deal.stage.replaceAll("_", " ")}</StageChip>}
        >
          <div className="grid gap-4 lg:grid-cols-3">
            <Field
              defaultValue={loanFile?.borrowerLegalName ?? deal.borrower.name}
              label="Borrower legal name"
              name="borrowerLegalName"
            />
            <Field
              defaultValue={loanFile?.entityLegalName ?? ""}
              label="Entity legal name"
              name="entityLegalName"
            />
            <Field
              defaultValue={loanFile?.referralSource ?? deal.source}
              label="Referral source"
              name="referralSource"
            />
          </div>
        </Panel>

        <Section
          description="Everything needed to identify the borrower and keep intake complete."
          fields={[
            {
              label: "Borrower tax ID / last four",
              name: "borrowerTaxId",
              value: loanFile?.borrowerTaxId,
            },
            {
              label: "Borrower date of birth",
              name: "borrowerDob",
              value: loanFile?.borrowerDob,
            },
            {
              label: "Co-borrower name",
              name: "coBorrowerName",
              value: loanFile?.coBorrowerName,
            },
            {
              label: "Co-borrower credit score",
              name: "coBorrowerCreditScore",
              value: loanFile?.coBorrowerCreditScore,
            },
            {
              label: "Entity state",
              name: "entityState",
              value: loanFile?.entityState,
            },
            {
              label: "Guarantors",
              name: "guarantors",
              value: loanFile?.guarantors,
            },
          ]}
          pinBaseHref={`/deals/${deal.id}/file`}
          title="Borrower and entity"
        />

        <Section
          description="The core request and pricing assumptions from the start of the loan."
          fields={[
            {
              label: "Loan purpose",
              name: "loanPurpose",
              value: loanFile?.loanPurpose,
            },
            {
              label: "Requested loan amount",
              name: "requestedLoanAmount",
              value: loanFile?.requestedLoanAmount,
            },
            {
              label: "Purchase price",
              name: "purchasePrice",
              value: loanFile?.purchasePrice,
            },
            {
              label: "Estimated value",
              name: "estimatedValue",
              value: loanFile?.estimatedValue,
            },
            {
              label: "Cash to close",
              name: "cashToClose",
              value: loanFile?.cashToClose,
            },
            {
              label: "Rate preference",
              name: "ratePreference",
              value: loanFile?.ratePreference,
            },
            {
              label: "Term months",
              name: "termMonths",
              value: loanFile?.termMonths,
            },
            {
              label: "Amortization months",
              name: "amortizationMonths",
              value: loanFile?.amortizationMonths,
            },
          ]}
          pinBaseHref={`/deals/${deal.id}/file`}
          title="Loan request"
        />

        <Section
          description="Subject property details that tend to drive valuation, title, insurance, and occupancy decisions."
          fields={[
            {
              label: "Property type",
              name: "propertyType",
              value: loanFile?.propertyType,
            },
            {
              label: "Occupancy plan",
              name: "occupancyPlan",
              value: loanFile?.occupancyPlan,
            },
            {
              label: "Unit count",
              name: "unitCount",
              value: loanFile?.unitCount,
            },
            {
              label: "Year built",
              name: "yearBuilt",
              value: loanFile?.yearBuilt,
            },
            {
              label: "Title status",
              name: "titleStatus",
              value: loanFile?.titleStatus,
            },
            {
              label: "Appraisal status",
              name: "appraisalStatus",
              value: loanFile?.appraisalStatus,
            },
            {
              label: "Insurance status",
              name: "insuranceStatus",
              value: loanFile?.insuranceStatus,
            },
            {
              label: "Flood zone status",
              name: "floodZoneStatus",
              value: loanFile?.floodZoneStatus,
            },
          ]}
          pinBaseHref={`/deals/${deal.id}/file`}
          title="Property and collateral"
        />

        <Section
          description="Use the fields that matter for residential or CRE and leave the rest blank."
          fields={[
            {
              label: "Monthly income",
              name: "monthlyIncome",
              value: loanFile?.monthlyIncome,
            },
            {
              label: "Monthly debt",
              name: "monthlyDebt",
              value: loanFile?.monthlyDebt,
            },
            {
              label: "Liquid assets",
              name: "liquidAssets",
              value: loanFile?.liquidAssets,
            },
            {
              label: "Reserves on hand",
              name: "reservesOnHand",
              value: loanFile?.reservesOnHand,
            },
            {
              label: "NOI",
              name: "noi",
              value: loanFile?.noi,
            },
            {
              label: "DSCR",
              name: "dscr",
              value: loanFile?.dscr,
            },
            {
              label: "Credit score",
              name: "creditScore",
              value: loanFile?.creditScore,
            },
            {
              label: "DTI",
              name: "dti",
              value: loanFile?.dti,
            },
          ]}
          pinBaseHref={`/deals/${deal.id}/file`}
          title="Financial and underwriting"
        />

        <Section
          description="These fields keep the active work of the file visible during processing."
          textareas={[
            {
              label: "Background summary",
              name: "backgroundSummary",
              value: loanFile?.backgroundSummary,
            },
            {
              label: "Conditions summary",
              name: "conditionsSummary",
              value: loanFile?.conditionsSummary,
            },
            {
              label: "Missing items summary",
              name: "missingItemsSummary",
              value: loanFile?.missingItemsSummary,
            },
            {
              label: "Processor notes",
              name: "processorNotes",
              value: loanFile?.processorNotes,
            },
            {
              label: "Underwriting notes",
              name: "underwritingNotes",
              value: loanFile?.underwritingNotes,
            },
          ]}
          pinBaseHref={`/deals/${deal.id}/file`}
          title="Process notes and conditions"
        />

        <Panel
          title="Task manager"
          description="Keep simple file-specific tasks inside the client file so the next move is visible while you edit the record."
        >
          <div className="mb-4 grid gap-3 md:grid-cols-3">
            <SummaryTile label="Open tasks" value={`${openTasks}`} />
            <SummaryTile label="Completed tasks" value={`${doneTasks}`} />
            <SummaryTile label="Overdue tasks" value={`${overdueTasks}`} />
          </div>

          <div className="grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
            <div className="space-y-3">
              {deal.tasks.length === 0 ? (
                <div className="rounded-[20px] border border-dashed border-slate-200 bg-slate-50/60 px-4 py-6 text-sm text-slate-500">
                  No tasks yet for this file.
                </div>
              ) : (
                deal.tasks.map((task) => (
                  <div
                    key={task.id}
                    className="grid gap-4 rounded-[22px] border border-slate-200 bg-slate-50/70 p-4 lg:grid-cols-[minmax(0,1.3fr)_120px_120px_140px]"
                  >
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <PriorityChip priority={task.priority} />
                        <span className="text-xs font-medium uppercase tracking-[0.16em] text-slate-500">
                          {task.category}
                        </span>
                      </div>
                      <p className="mt-3 text-base font-semibold text-slate-950">
                        {task.title}
                      </p>
                      <p className="mt-1 text-sm text-slate-500">Owner: {task.owner}</p>
                    </div>
                    <TaskStat label="Due" value={shortDate(task.dueDate)} />
                    <TaskStat
                      label="Status"
                      value={task.status === "OPEN" ? "Open" : "Done"}
                    />
                    <div className="flex items-start justify-start lg:justify-end">
                      {task.status === "OPEN" ? (
                        <form action={completeTaskAction}>
                          <input name="taskId" type="hidden" value={task.id} />
                          <input
                            name="returnTo"
                            type="hidden"
                            value={`/deals/${deal.id}/file?taskDone=1`}
                          />
                          <button
                            className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-100"
                            type="submit"
                          >
                            Mark done
                          </button>
                        </form>
                      ) : (
                        <span className="inline-flex rounded-full bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-800">
                          Complete
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            <form action={createTaskAction} className="grid gap-4 rounded-[22px] border border-slate-200 bg-slate-50/70 p-4">
              <input name="dealId" type="hidden" value={deal.id} />
              <input
                name="returnTo"
                type="hidden"
                value={`/deals/${deal.id}/file?taskSaved=1`}
              />
              <Field defaultValue="" label="Task title" name="title" />
              <Field defaultValue="" label="Owner" name="owner" />
              <Field defaultValue="" label="Category" name="category" />
              <label className="grid gap-2 text-sm">
                <span className="font-medium text-slate-700">Priority</span>
                <select
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-emerald-400"
                  defaultValue={TaskPriority.MEDIUM}
                  name="priority"
                >
                  {Object.values(TaskPriority).map((priority) => (
                    <option key={priority} value={priority}>
                      {priority}
                    </option>
                  ))}
                </select>
              </label>
              <label className="grid gap-2 text-sm">
                <span className="font-medium text-slate-700">Due date</span>
                <input
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-emerald-400"
                  name="dueDate"
                  required
                  type="date"
                />
              </label>
              <button
                className="inline-flex items-center justify-center rounded-full bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-700"
                type="submit"
              >
                Add task
              </button>
            </form>
          </div>
        </Panel>

        <Section
          description="Late-stage fields for closing and early servicing."
          fields={[
            {
              label: "Closing attorney",
              name: "closingAttorney",
              value: loanFile?.closingAttorney,
            },
            {
              label: "Target closing date",
              name: "targetClosingDate",
              value: loanFile?.targetClosingDate,
            },
            {
              label: "Funded amount",
              name: "fundedAmount",
              value: loanFile?.fundedAmount,
            },
            {
              label: "First payment date",
              name: "firstPaymentDate",
              value: loanFile?.firstPaymentDate,
            },
            {
              label: "Exit strategy",
              name: "exitStrategy",
              value: loanFile?.exitStrategy,
            },
          ]}
          textareas={[
            {
              label: "Closing conditions",
              name: "closingConditions",
              value: loanFile?.closingConditions,
            },
            {
              label: "Relationship notes",
              name: "relationshipNotes",
              value: loanFile?.relationshipNotes,
            },
          ]}
          pinBaseHref={`/deals/${deal.id}/file`}
          title="Closing and post-close"
        />

        <div className="flex flex-wrap gap-3">
          <button
            className="inline-flex items-center justify-center rounded-full bg-[var(--brand-green)] px-5 py-3 text-sm font-medium text-white shadow-[0_10px_24px_rgba(31,143,47,0.22)] transition hover:bg-[var(--brand-green-deep)]"
            type="submit"
          >
            Save client file
          </button>
          <SecondaryLink href={`/deals/${deal.id}`}>Back to workspace</SecondaryLink>
        </div>
      </form>
    </AppFrame>
  );
}

function Section({
  title,
  description,
  fields,
  pinBaseHref,
  textareas,
}: {
  title: string;
  description: string;
  fields?: Array<{ label: string; name: string; value?: string | null }>;
  pinBaseHref: string;
  textareas?: Array<{ label: string; name: string; value?: string | null }>;
}) {
  return (
    <Panel
      title={title}
      description={description}
      action={
        <PinToQuickManagerButton
          item={{
            id: `pin-section-${slugify(title)}`,
            label: title,
            href: `${pinBaseHref}#section-${slugify(title)}`,
            category: "FILE",
            note: "Pinned section",
          }}
          size="xs"
        />
      }
    >
      <div id={`section-${slugify(title)}`}>
        {fields?.length ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {fields.map((field) => (
              <Field
                key={field.name}
                defaultValue={field.value ?? ""}
                label={field.label}
                name={field.name}
                pinBaseHref={pinBaseHref}
              />
            ))}
          </div>
        ) : null}

        {textareas?.length ? (
          <div
            className={`grid gap-4 ${fields?.length ? "mt-4" : ""} ${
              textareas.length > 1 ? "xl:grid-cols-2" : ""
            }`}
          >
            {textareas.map((field) => (
              <TextAreaField
                key={field.name}
                defaultValue={field.value ?? ""}
                label={field.label}
                name={field.name}
                pinBaseHref={pinBaseHref}
              />
            ))}
          </div>
        ) : null}
      </div>
    </Panel>
  );
}

function Field({
  label,
  name,
  pinBaseHref,
  defaultValue,
}: {
  label: string;
  name: string;
  pinBaseHref?: string;
  defaultValue: string;
}) {
  return (
    <label className="grid gap-2 text-sm" id={`field-${name}`}>
      <span className="flex items-center justify-between gap-3">
        <span className="font-medium text-slate-700">{label}</span>
        {pinBaseHref ? (
          <PinToQuickManagerButton
            item={{
              id: `pin-field-${name}`,
              label,
              href: `${pinBaseHref}#field-${name}`,
              category: "FILE",
              note: "Pinned field",
            }}
            size="xs"
          />
        ) : null}
      </span>
      <input
        className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-emerald-400"
        defaultValue={defaultValue}
        name={name}
      />
    </label>
  );
}

function TextAreaField({
  label,
  name,
  pinBaseHref,
  defaultValue,
}: {
  label: string;
  name: string;
  pinBaseHref?: string;
  defaultValue: string;
}) {
  return (
    <label className="grid gap-2 text-sm" id={`field-${name}`}>
      <span className="flex items-center justify-between gap-3">
        <span className="font-medium text-slate-700">{label}</span>
        {pinBaseHref ? (
          <PinToQuickManagerButton
            item={{
              id: `pin-field-${name}`,
              label,
              href: `${pinBaseHref}#field-${name}`,
              category: "FILE",
              note: "Pinned field",
            }}
            size="xs"
          />
        ) : null}
      </span>
      <textarea
        className="min-h-32 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-emerald-400"
        defaultValue={defaultValue}
        name={name}
      />
    </label>
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

function PriorityChip({ priority }: { priority: TaskPriority }) {
  const tone =
    priority === TaskPriority.HIGH
      ? "bg-rose-50 text-rose-800"
      : priority === TaskPriority.MEDIUM
        ? "bg-amber-50 text-amber-800"
        : "bg-slate-100 text-slate-700";

  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] ${tone}`}
    >
      {priority}
    </span>
  );
}

function TaskStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-sm">
      <p className="text-slate-500">{label}</p>
      <p className="mt-1 font-medium text-slate-900">{value}</p>
    </div>
  );
}

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}
