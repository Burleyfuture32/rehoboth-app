import { StatusTrackerStatus } from "@prisma/client";
import { notFound } from "next/navigation";
import {
  recalculateStatusTrackerAction,
  resetStatusTrackerSectionAction,
  saveStatusTrackerSectionAction,
} from "@/app/actions";
import { AppFrame } from "@/components/app-frame";
import { DealTabs } from "@/components/deal-tabs";
import { PinToQuickManagerButton } from "@/components/pin-to-quick-manager-button";
import {
  PageHeader,
  Panel,
  PrimaryLink,
  SecondaryLink,
} from "@/components/ui";
import { shortDate, shortDateTime } from "@/lib/format";
import {
  filterStatusTrackerSections,
  formatStatusTrackerValue,
  getStatusTrackerFilter,
  getStatusTrackerLabel,
  getStatusTrackerPageData,
  getStatusTrackerTone,
  statusTrackerFilterValues,
} from "@/lib/status-tracker";

export default async function StatusTrackerPage({
  params,
  searchParams,
}: {
  params: Promise<{ dealId: string }>;
  searchParams: Promise<{ filter?: string; saved?: string }>;
}) {
  const [{ dealId }, pageParams] = await Promise.all([params, searchParams]);
  const trackerData = await getStatusTrackerPageData(dealId);

  if (!trackerData) {
    notFound();
  }

  const filter = getStatusTrackerFilter(pageParams.filter);
  const visibleSections = filterStatusTrackerSections(trackerData.sections, filter);

  return (
    <AppFrame>
      <PageHeader
        eyebrow="Deal status tracker"
        title={`${trackerData.deal.borrower.name} status tracker`}
        description="Leadership should be able to open one tab and immediately see what is complete, what is blocked, and what is overdue across the five core file owners."
        actions={
          <>
            <PinToQuickManagerButton
              item={{
                id: `pin-status-tracker-${trackerData.deal.id}`,
                label: `${trackerData.deal.borrower.name} status tracker`,
                href: `/deals/${trackerData.deal.id}/status-tracker${filter === "all" ? "" : `?filter=${filter}`}`,
                category: "TRACKER",
                note: trackerData.deal.name,
              }}
            />
            <PrimaryLink href={`/deals/${trackerData.deal.id}`}>
              Back to workspace
            </PrimaryLink>
            <SecondaryLink href={`/deals/${trackerData.deal.id}/summary`}>
              Open submission summary
            </SecondaryLink>
            <SecondaryLink href={`/deals/${trackerData.deal.id}/file`}>
              Open client file
            </SecondaryLink>
          </>
        }
      />

      <DealTabs current="status-tracker" dealId={trackerData.deal.id} />

      {pageParams.saved ? (
        <div className="mb-6 rounded-[24px] border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-900">
          Status tracker updated.
        </div>
      ) : null}

      <Panel
        title="Overall deal status"
        description="The summary stays simple on purpose: overall completion, overdue visibility, and one blocker callout."
        action={
          <form action={recalculateStatusTrackerAction}>
            <input name="dealId" type="hidden" value={trackerData.deal.id} />
            <input
              name="returnTo"
              type="hidden"
              value={`/deals/${trackerData.deal.id}/status-tracker?saved=1&filter=${filter}`}
            />
            <input name="updatedByName" type="hidden" value="System" />
            <button
              className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-100"
              type="submit"
            >
              Recalculate status
            </button>
          </form>
        }
      >
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
          <div>
            <div className="rounded-[24px] border border-slate-200 bg-slate-50/70 p-4">
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <p className="text-sm text-slate-500">Overall deal status</p>
                  <p className="mt-2 text-4xl font-semibold tracking-[-0.04em] text-slate-950">
                    {trackerData.summary.overallPercent}%
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {trackerData.summary.completedSections} of{" "}
                    {trackerData.summary.totalSections} sections complete
                  </p>
                </div>
                <div className="rounded-[20px] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
                  Last recalculated by live rules when file activity changes.
                </div>
              </div>
              <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-200">
                <div
                  className="h-full rounded-full bg-[linear-gradient(90deg,var(--brand-green)_0%,var(--brand-gold)_100%)]"
                  style={{ width: `${trackerData.summary.overallPercent}%` }}
                />
              </div>
            </div>

            {trackerData.summary.overdueSectionsCount > 0 ? (
              <div className="mt-4 rounded-[22px] border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-900">
                <p className="font-semibold">
                  {trackerData.summary.overdueSectionsCount} section
                  {trackerData.summary.overdueSectionsCount === 1 ? "" : "s"} overdue
                </p>
                <p className="mt-1 leading-6">
                  {trackerData.summary.activeBlockerSummary ??
                    "One or more deal owners are past due and need attention."}
                </p>
              </div>
            ) : null}
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-1">
            <SummaryCard
              label="Pending sections"
              value={`${trackerData.summary.pendingSections}`}
            />
            <SummaryCard
              label="In progress"
              value={`${trackerData.summary.inProgressSections}`}
            />
            <SummaryCard
              label="Overdue"
              value={`${trackerData.summary.overdueSectionsCount}`}
            />
            <SummaryCard
              label="Active blocker"
              value={
                trackerData.summary.activeBlockerSummary
                  ? "Yes"
                  : "No current blocker"
              }
            />
          </div>
        </div>
      </Panel>

      <div className="mt-4 flex flex-wrap gap-2">
        {statusTrackerFilterValues.map((value) => {
          const isActive = value === filter;
          const href =
            value === "all"
              ? `/deals/${trackerData.deal.id}/status-tracker`
              : `/deals/${trackerData.deal.id}/status-tracker?filter=${value}`;

          return (
            <a
              key={value}
              className={`inline-flex items-center justify-center rounded-full border px-4 py-2 text-sm font-medium transition ${
                isActive
                  ? "border-[var(--brand-green)] bg-[var(--brand-green)] text-white"
                  : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-100"
              }`}
              href={href}
            >
              {value === "all" ? "All sections" : formatFilterLabel(value)}
            </a>
          );
        })}
      </div>

      <div className="mt-4 grid gap-4">
        {visibleSections.length === 0 ? (
          <Panel
            title="No sections match this filter"
            description="Switch filters to see the rest of the tracker."
          >
            <p className="text-sm text-slate-600">
              Nothing in this deal currently matches the {formatFilterLabel(filter).toLowerCase()} filter.
            </p>
          </Panel>
        ) : null}

        {visibleSections.map((section) => (
          <details
            key={section.id}
            id={`section-${section.id}`}
            className={`rounded-[28px] border bg-[color:var(--surface)] p-5 shadow-[0_18px_50px_rgba(16,24,18,0.08)] ${section.isOverdue ? "border-rose-200" : "border-[color:var(--border-soft)]"}`}
          >
            <summary className="cursor-pointer list-none">
              <div className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_160px_160px_180px]">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] ${getStatusTrackerTone(section.status)}`}
                    >
                      {formatStatusTrackerValue(section.status)}
                    </span>
                    {section.manualOverride ? (
                      <span className="inline-flex rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-700">
                        Manual override
                      </span>
                    ) : null}
                    <PinToQuickManagerButton
                      item={{
                        id: `pin-tracker-section-${section.id}`,
                        label: getStatusTrackerLabel(section.sectionKey),
                        href: `/deals/${trackerData.deal.id}/status-tracker${filter === "all" ? "" : `?filter=${filter}`}#section-${section.id}`,
                        category: "TRACKER",
                        note: section.personOrCompanyName ?? "Unassigned",
                      }}
                      size="xs"
                    />
                  </div>
                  <h2 className="mt-3 text-lg font-semibold text-slate-950">
                    {getStatusTrackerLabel(section.sectionKey)} -{" "}
                    {section.personOrCompanyName ?? "Unassigned"}
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    {section.assignedToName ?? "Unassigned"} owns the next move.
                  </p>
                  <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
                    {section.notes ?? "No notes yet"}
                  </p>
                  {section.blockerReason ? (
                    <p className="mt-2 text-sm font-medium text-rose-700">
                      Blocker: {section.blockerReason}
                    </p>
                  ) : null}
                </div>

                <InfoCell
                  label="Due date"
                  value={
                    section.dueDate ? shortDate(section.dueDate) : "No due date set"
                  }
                />
                <InfoCell
                  label="Progress"
                  value={`${section.percentComplete}%`}
                />
                <InfoCell
                  label="Last updated"
                  value={shortDateTime(section.updatedAt)}
                  subValue={section.updatedByName ?? "System"}
                />
              </div>
            </summary>

            <div className="mt-5 border-t border-slate-200 pt-5">
              <div className="mb-4 h-2 overflow-hidden rounded-full bg-slate-200">
                <div
                  className={`h-full rounded-full ${
                    section.status === StatusTrackerStatus.OVERDUE
                      ? "bg-rose-500"
                      : section.status === StatusTrackerStatus.COMPLETE
                        ? "bg-emerald-600"
                        : section.status === StatusTrackerStatus.PENDING
                          ? "bg-amber-500"
                          : section.status === StatusTrackerStatus.IN_PROGRESS
                            ? "bg-sky-500"
                            : "bg-slate-400"
                  }`}
                  style={{ width: `${section.percentComplete}%` }}
                />
              </div>

              <div className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
                <form action={saveStatusTrackerSectionAction} className="grid gap-4">
                  <input name="dealId" type="hidden" value={trackerData.deal.id} />
                  <input name="sectionId" type="hidden" value={section.id} />
                  <input
                    name="returnTo"
                    type="hidden"
                    value={`/deals/${trackerData.deal.id}/status-tracker?saved=1&filter=${filter}`}
                  />

                  <div className="grid gap-4 md:grid-cols-2">
                    <Field
                      defaultValue={section.personOrCompanyName ?? ""}
                      label="Person or company"
                      name="personOrCompanyName"
                      placeholder="Unassigned"
                    />
                    <Field
                      defaultValue={section.assignedToName ?? ""}
                      label="Assigned owner"
                      name="assignedToName"
                      placeholder="Unassigned"
                    />
                    <SelectField
                      defaultValue={section.status}
                      label="Status"
                      name="status"
                      options={Object.values(StatusTrackerStatus)}
                    />
                    <Field
                      defaultValue={dateInputValue(section.dueDate)}
                      label="Due date"
                      name="dueDate"
                      placeholder=""
                      type="date"
                    />
                  </div>

                  <TextAreaField
                    defaultValue={section.notes ?? ""}
                    label="Notes"
                    name="notes"
                    placeholder="Short status note for leadership and operations."
                  />
                  <TextAreaField
                    defaultValue={section.blockerReason ?? ""}
                    label="Blocker reason"
                    name="blockerReason"
                    placeholder="Why is this section waiting or at risk?"
                  />

                  <div className="grid gap-4 md:grid-cols-2">
                    <Field
                      defaultValue={section.updatedByName ?? defaultUpdatedBy()}
                      label="Updated by"
                      name="updatedByName"
                      placeholder="Kelvin Abram"
                    />
                    <TextAreaField
                      defaultValue={section.manualOverrideReason ?? ""}
                      label="Override reason"
                      minHeight="min-h-24"
                      name="overrideReason"
                      placeholder="Why this manual update is necessary."
                    />
                  </div>

                  <button
                    className="inline-flex items-center justify-center rounded-full bg-[var(--brand-green)] px-5 py-3 text-sm font-medium text-white shadow-[0_10px_24px_rgba(31,143,47,0.22)] transition hover:bg-[var(--brand-green-deep)]"
                    type="submit"
                  >
                    Save manual override
                  </button>
                </form>

                <div className="grid gap-4">
                  {section.manualOverride ? (
                    <form action={resetStatusTrackerSectionAction}>
                      <input name="dealId" type="hidden" value={trackerData.deal.id} />
                      <input name="sectionId" type="hidden" value={section.id} />
                      <input
                        name="returnTo"
                        type="hidden"
                        value={`/deals/${trackerData.deal.id}/status-tracker?saved=1&filter=${filter}`}
                      />
                      <input
                        name="updatedByName"
                        type="hidden"
                        value={section.updatedByName ?? "System"}
                      />
                      <button
                        className="inline-flex w-full items-center justify-center rounded-full border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-100"
                        type="submit"
                      >
                        Use automatic status
                      </button>
                    </form>
                  ) : null}

                  <Panel
                    title="Section snapshot"
                    description="This stays visible for fast scanning even before the editor is expanded."
                  >
                    <div className="space-y-3">
                      <InfoRow
                        label="Section"
                        value={getStatusTrackerLabel(section.sectionKey)}
                      />
                      <InfoRow
                        label="Status"
                        value={formatStatusTrackerValue(section.status)}
                      />
                      <InfoRow
                        label="Due"
                        value={
                          section.dueDate
                            ? shortDate(section.dueDate)
                            : "No due date set"
                        }
                      />
                      <InfoRow
                        label="Updated"
                        value={`${shortDateTime(section.updatedAt)} by ${section.updatedByName ?? "System"}`}
                      />
                    </div>
                  </Panel>
                </div>
              </div>
            </div>
          </details>
        ))}
      </div>

      <div className="mt-4">
        <Panel
          title="Recent tracker activity"
          description="Manual overrides and recalculations leave a paper trail for the next operator."
        >
          <div className="space-y-3">
            {trackerData.deal.activities.length === 0 ? (
              <p className="text-sm text-slate-600">
                No tracker-specific activity yet.
              </p>
            ) : (
              trackerData.deal.activities.map((activity) => (
                <div
                  key={activity.id}
                  className="rounded-[20px] border border-slate-200 bg-slate-50/70 p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-950">
                        {activity.title}
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        {activity.createdBy} - {shortDateTime(activity.createdAt)}
                      </p>
                    </div>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {activity.body}
                  </p>
                </div>
              ))
            )}
          </div>
        </Panel>
      </div>
    </AppFrame>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[22px] border border-slate-200 bg-slate-50/70 p-4">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-slate-950">
        {value}
      </p>
    </div>
  );
}

function InfoCell({
  label,
  value,
  subValue,
}: {
  label: string;
  value: string;
  subValue?: string;
}) {
  return (
    <div className="rounded-[20px] border border-slate-200 bg-slate-50/70 p-4">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-2 text-sm font-medium leading-6 text-slate-900">{value}</p>
      {subValue ? (
        <p className="mt-1 text-xs uppercase tracking-[0.16em] text-slate-500">
          {subValue}
        </p>
      ) : null}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-[18px] border border-slate-200 bg-slate-50/70 px-4 py-3">
      <span className="text-sm text-slate-500">{label}</span>
      <strong className="text-right text-sm text-slate-950">{value}</strong>
    </div>
  );
}

function Field({
  defaultValue,
  label,
  name,
  placeholder,
  type = "text",
}: {
  defaultValue: string;
  label: string;
  name: string;
  placeholder: string;
  type?: string;
}) {
  return (
    <label className="grid gap-2 text-sm">
      <span className="font-medium text-slate-700">{label}</span>
      <input
        className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-emerald-400"
        defaultValue={defaultValue}
        name={name}
        placeholder={placeholder}
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
  options: string[];
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
            {formatStatusTrackerValue(option as StatusTrackerStatus)}
          </option>
        ))}
      </select>
    </label>
  );
}

function TextAreaField({
  defaultValue,
  label,
  name,
  placeholder,
  minHeight = "min-h-28",
}: {
  defaultValue: string;
  label: string;
  name: string;
  placeholder: string;
  minHeight?: string;
}) {
  return (
    <label className="grid gap-2 text-sm">
      <span className="font-medium text-slate-700">{label}</span>
      <textarea
        className={`${minHeight} rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-emerald-400`}
        defaultValue={defaultValue}
        name={name}
        placeholder={placeholder}
      />
    </label>
  );
}

function dateInputValue(value: Date | null) {
  return value ? value.toISOString().slice(0, 10) : "";
}

function formatFilterLabel(value: string) {
  switch (value) {
    case "overdue":
      return "Overdue";
    case "pending":
      return "Needs attention";
    case "complete":
      return "Complete";
    default:
      return "All sections";
  }
}

function defaultUpdatedBy() {
  return "Kelvin Abram";
}
