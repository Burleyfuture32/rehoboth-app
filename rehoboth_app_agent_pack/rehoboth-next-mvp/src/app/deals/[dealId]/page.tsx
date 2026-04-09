import { SubmissionStatus } from "@prisma/client";
import { notFound } from "next/navigation";
import {
  advanceDealStageAction,
  completeTaskAction,
  requestDocumentAction,
  uploadDocumentAction,
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
import { currency, shortDate } from "@/lib/format";
import { getDealWorkspaceData } from "@/lib/pipeline";

const priorityTone = {
  HIGH: "bg-rose-50 text-rose-800",
  MEDIUM: "bg-amber-50 text-amber-800",
  LOW: "bg-slate-100 text-slate-700",
} as const;

const documentTone = {
  REQUESTED: "bg-amber-50 text-amber-800",
  UPLOADED: "bg-emerald-50 text-emerald-800",
} as const;

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

const communicationTone = {
  EMAIL: "bg-sky-50 text-sky-900",
  TEXT: "bg-emerald-50 text-emerald-900",
  CALL: "bg-amber-50 text-amber-900",
} as const;

export default async function DealWorkspacePage({
  params,
}: {
  params: Promise<{ dealId: string }>;
}) {
  const { dealId } = await params;
  const deal = await getDealWorkspaceData(dealId);

  if (!deal) {
    notFound();
  }

  const openTasks = deal.tasks.filter((task) => task.status === "OPEN");
  const requestedDocuments = deal.documentRequests.filter(
    (document) => document.status === "REQUESTED",
  );
  const uploadedDocuments = deal.documentRequests.filter(
    (document) => document.status === "UPLOADED",
  );
  const submissionStatus =
    deal.loanFile?.submissionStatus ?? SubmissionStatus.NOT_READY;

  return (
    <AppFrame>
      <PageHeader
        eyebrow="Borrower and deal workspace"
        title={deal.name}
        description={`${deal.borrower.name} | ${deal.market} | ${deal.program}. This page keeps the operator on one deal at a time with the facts, tasks, and document requests in one place.`}
        actions={
          <>
            <PrimaryLink href="/pipeline">Back to pipeline</PrimaryLink>
            <SecondaryLink href="/tasks">Open task center</SecondaryLink>
            <SecondaryLink href={`/workflows?dealId=${deal.id}`}>
              Launch workflow
            </SecondaryLink>
            <SecondaryLink href={`/deals/${deal.id}/summary`}>
              Open submission summary
            </SecondaryLink>
            <SecondaryLink href={`/deals/${deal.id}/file`}>
              Open full client file
            </SecondaryLink>
            <SecondaryLink href={`/deals/${deal.id}/communications`}>
              Open communications
            </SecondaryLink>
            <SecondaryLink href={`/knowledge-base?dealId=${deal.id}`}>
              Open knowledge base
            </SecondaryLink>
            <SecondaryLink href={`/deals/${deal.id}/status-tracker`}>
              Open status tracker
            </SecondaryLink>
            <SecondaryLink href={`/documents?dealId=${deal.id}`}>
              Open document center
            </SecondaryLink>
          </>
        }
      />

      <ClientStatusBar deal={deal} />
      <DealTabs current="workspace" dealId={deal.id} />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.85fr)]">
        <div className="grid gap-4">
          <Panel
            title="Deal snapshot"
            description="This is the minimum information a low-tech user should see before they click anything else."
            action={<StageChip>{deal.stage.replaceAll("_", " ")}</StageChip>}
          >
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              <DetailItem label="Loan amount" value={currency(deal.loanAmount)} />
              <DetailItem
                label="Estimated value"
                value={currency(deal.estimatedValue)}
              />
              <DetailItem label="LTV" value={`${deal.ltv}%`} />
              <DetailItem label="Deal type" value={deal.dealType} />
              <DetailItem label="Target close" value={shortDate(deal.targetCloseDate)} />
              <DetailItem label="Source" value={deal.source} />
              <DetailItem
                label="Property"
                value={deal.propertyAddress}
                span="md:col-span-2 xl:col-span-3"
              />
              <DetailItem
                label="Summary"
                value={deal.summary}
                span="md:col-span-2 xl:col-span-3"
              />
            </div>

            <form action={advanceDealStageAction} className="mt-5">
              <input name="dealId" type="hidden" value={deal.id} />
              <button
                className="inline-flex items-center justify-center rounded-full bg-emerald-700 px-5 py-3 text-sm font-medium text-white transition hover:bg-emerald-800"
                type="submit"
              >
                Advance stage
              </button>
            </form>
          </Panel>

          <Panel
            title="Document requests"
            description="Keep requests and uploads close to the deal so the operator does not need a separate system for the demo."
            action={
              <SecondaryLink href={`/documents?dealId=${deal.id}`}>
                Full document view
              </SecondaryLink>
            }
          >
            <div className="grid gap-3 md:grid-cols-3">
              <ProgressRow
                label="Requested docs"
                value={`${requestedDocuments.length}`}
              />
              <ProgressRow
                label="Uploaded docs"
                value={`${uploadedDocuments.length}`}
              />
              <ProgressRow
                label="Total docs"
                value={`${deal.documentRequests.length}`}
              />
            </div>

            <form action={requestDocumentAction} className="mt-4 grid gap-4">
              <input name="dealId" type="hidden" value={deal.id} />
              <input name="returnTo" type="hidden" value={`/deals/${deal.id}`} />
              <div className="grid gap-4 md:grid-cols-3">
                <InlineField
                  label="Document name"
                  name="title"
                  placeholder="Trailing twelve month P&L"
                />
                <InlineField
                  label="Category"
                  name="category"
                  placeholder="Financials"
                />
                <InlineField
                  defaultValue="Nora Wells"
                  label="Requested by"
                  name="requestedBy"
                  placeholder="Nora Wells"
                />
              </div>
              <label className="grid gap-2 text-sm">
                <span className="font-medium text-slate-700">Notes</span>
                <textarea
                  className="min-h-24 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-emerald-400"
                  name="notes"
                  placeholder="Short note explaining what is still needed."
                />
              </label>
              <div>
                <button
                  className="inline-flex items-center justify-center rounded-full bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-700"
                  type="submit"
                >
                  Add document request
                </button>
              </div>
            </form>

            <div className="mt-4 space-y-3">
              {deal.documentRequests.length === 0 ? (
                <div className="rounded-[20px] border border-dashed border-slate-200 bg-slate-50/60 px-4 py-6 text-sm text-slate-500">
                  No document requests yet.
                </div>
              ) : null}

              {deal.documentRequests.map((document) => (
                <div
                  key={document.id}
                  className="grid gap-4 rounded-[22px] border border-slate-200 bg-slate-50/70 p-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,220px)]"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] ${documentTone[document.status]}`}
                      >
                        {document.status}
                      </span>
                      <span className="text-xs font-medium uppercase tracking-[0.16em] text-slate-500">
                        {document.category}
                      </span>
                    </div>
                    <h3 className="mt-3 text-base font-semibold text-slate-950">
                      {document.title}
                    </h3>
                    <p className="mt-1 text-sm text-slate-500">
                      Requested by {document.requestedBy} on {shortDate(document.createdAt)}
                    </p>
                    {document.notes ? (
                      <p className="mt-2 text-sm leading-6 text-slate-600">
                        {document.notes}
                      </p>
                    ) : null}
                  </div>

                  <div className="min-w-0 text-sm">
                    <p className="text-slate-500">Current file</p>
                    {document.uploadedFileUrl ? (
                      <div className="mt-2 space-y-2">
                        <p className="font-medium text-slate-900">
                          {document.uploadedFileName}
                        </p>
                        <a
                          className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-100"
                          href={document.uploadedFileUrl}
                          rel="noreferrer"
                          target="_blank"
                        >
                          Open file
                        </a>
                      </div>
                    ) : document.status === "UPLOADED" ? (
                      <div className="mt-2 space-y-2">
                        <p className="font-medium text-slate-900">
                          {document.uploadedFileName ?? "Uploaded source file"}
                        </p>
                        <p className="text-slate-600">
                          Seeded from the source file set for the demo.
                        </p>
                      </div>
                    ) : (
                      <p className="mt-2 text-slate-600">Waiting on upload.</p>
                    )}
                  </div>

                  <form
                    action={uploadDocumentAction}
                    className="grid min-w-0 gap-3 xl:col-span-2 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-end"
                  >
                    <input
                      name="documentRequestId"
                      type="hidden"
                      value={document.id}
                    />
                    <input name="returnTo" type="hidden" value={`/deals/${deal.id}`} />
                    <label className="grid min-w-0 gap-2 text-sm">
                      <span className="font-medium text-slate-700">Upload file</span>
                      <input
                        className="block w-full min-w-0 max-w-full overflow-hidden rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 file:mr-3 file:rounded-full file:border-0 file:bg-slate-900 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-white"
                        name="file"
                        required={document.status === "REQUESTED"}
                        type="file"
                      />
                    </label>
                    <button
                      className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-100 xl:self-end"
                      type="submit"
                    >
                      Upload file
                    </button>
                  </form>
                </div>
              ))}
            </div>
          </Panel>

          <Panel
            title="Deal tasks"
            description="These tasks are scoped to this one borrower and property, so the next action stays obvious."
          >
            <div className="space-y-3">
              {deal.tasks.map((task) => (
                <div
                  key={task.id}
                  className="grid gap-4 rounded-[22px] border border-slate-200 bg-slate-50/70 p-4 lg:grid-cols-[minmax(0,1.4fr)_130px_130px_140px]"
                >
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] ${priorityTone[task.priority]}`}
                      >
                        {task.priority}
                      </span>
                      <span className="text-xs font-medium uppercase tracking-[0.16em] text-slate-500">
                        {task.category}
                      </span>
                    </div>
                    <h3 className="mt-3 text-base font-semibold text-slate-950">
                      {task.title}
                    </h3>
                    <p className="mt-1 text-sm text-slate-500">owner: {task.owner}</p>
                  </div>
                  <div className="text-sm">
                    <p className="text-slate-500">Due date</p>
                    <p className="mt-1 font-medium text-slate-900">
                      {shortDate(task.dueDate)}
                    </p>
                  </div>
                  <div className="text-sm">
                    <p className="text-slate-500">Status</p>
                    <p className="mt-1 font-medium text-slate-900">
                      {task.status === "OPEN" ? "Open" : "Done"}
                    </p>
                  </div>
                  <div className="flex items-start justify-start lg:justify-end">
                    {task.status === "OPEN" ? (
                      <form action={completeTaskAction}>
                        <input name="taskId" type="hidden" value={task.id} />
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
              ))}
            </div>
          </Panel>
        </div>

        <div className="grid gap-4">
          <Panel
            title="Submission readiness"
            description="This answers the lender handoff question without making the user open another screen first."
            action={
              <span
                className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] ${submissionTone[submissionStatus]}`}
              >
                {submissionStatus.replaceAll("_", " ")}
              </span>
            }
          >
            <div className="space-y-3">
              <ProgressRow
                label="Capital sources"
                value={`${deal.capitalSources.length}`}
              />
              <ProgressRow
                label="Recommended action"
                value={deal.loanFile?.recommendedAction ?? "Open submission summary"}
              />
              <ProgressRow
                label="Missing items"
                value={deal.loanFile?.missingItemsSummary ?? "Use tasks and docs below"}
              />
            </div>
            <div className="mt-4">
              <SecondaryLink href={`/deals/${deal.id}/summary`}>
                Open submission summary
              </SecondaryLink>
            </div>
          </Panel>

          <Panel
            title="Borrower profile"
            description="The borrower section should answer who this is and how far along the file feels."
          >
            <div className="space-y-4">
              <BorrowerItem label="Borrower" value={deal.borrower.name} />
              <BorrowerItem label="Entity type" value={deal.borrower.entityType} />
              <BorrowerItem label="Email" value={deal.borrower.email} />
              <BorrowerItem label="Phone" value={deal.borrower.phone} />
              <BorrowerItem
                label="Experience notes"
                value={deal.borrower.experience ?? "No notes yet"}
              />
            </div>
          </Panel>

          <Panel
            title="Capital sources"
            description="Keep a small lender view in the workspace so the user knows whether the file is already out."
          >
            <div className="space-y-3">
              {deal.capitalSources.length === 0 ? (
                <p className="text-sm text-slate-600">
                  No capital sources tracked yet.
                </p>
              ) : (
                deal.capitalSources.map((source) => (
                  <div
                    key={source.id}
                    className="rounded-[20px] border border-slate-200 bg-slate-50/70 p-4"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] ${capitalTone[source.status]}`}
                      >
                        {source.status.replaceAll("_", " ")}
                      </span>
                    </div>
                    <p className="mt-3 text-sm font-semibold text-slate-950">
                      {source.lenderName}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">{source.program}</p>
                  </div>
                ))
              )}
            </div>
          </Panel>

          <Panel
            title="Communications"
            description="This is the CRM view for the file: recent borrower and lender touches in one place."
            action={
              <SecondaryLink href={`/deals/${deal.id}/communications`}>
                Open communications
              </SecondaryLink>
            }
          >
            <div className="space-y-3">
              {deal.communicationLogs.length === 0 ? (
                <p className="text-sm text-slate-600">
                  No communications logged yet.
                </p>
              ) : (
                deal.communicationLogs.map((entry) => (
                  <div
                    key={entry.id}
                    className="rounded-[20px] border border-slate-200 bg-slate-50/70 p-4"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] ${communicationTone[entry.channel]}`}
                      >
                        {entry.channel}
                      </span>
                      <span className="text-xs font-medium uppercase tracking-[0.16em] text-slate-500">
                        {entry.direction.replaceAll("_", " ")}
                      </span>
                    </div>
                    <p className="mt-3 text-sm font-semibold text-slate-950">
                      {entry.subject ?? "Communication note"}
                    </p>
                    <p className="mt-1 text-sm leading-6 text-slate-600">
                      {entry.message}
                    </p>
                  </div>
                ))
              )}
            </div>
          </Panel>

          <Panel
            title="Knowledge history"
            description="Reusable Q&A notes saved from the knowledge base stay with the file so the next operator can pick up the same reasoning."
            action={
              <SecondaryLink href={`/knowledge-base?dealId=${deal.id}`}>
                Open knowledge base
              </SecondaryLink>
            }
          >
            <div className="space-y-3">
              {deal.knowledgeEntries.length === 0 ? (
                <p className="text-sm text-slate-600">
                  No file-specific knowledge notes saved yet.
                </p>
              ) : (
                deal.knowledgeEntries.map((entry) => (
                  <div
                    key={entry.id}
                    className="rounded-[20px] border border-slate-200 bg-slate-50/70 p-4"
                  >
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                      {entry.resourceKey?.replaceAll("-", " ") ?? "knowledge base"} |{" "}
                      {entry.createdBy}
                    </p>
                    <p className="mt-3 text-sm font-semibold text-slate-950">
                      Q: {entry.question}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      {entry.answer}
                    </p>
                  </div>
                ))
              )}
            </div>
          </Panel>

          <Panel
            title="Recent file activity"
            description="Recent notes and automatic updates help the next person pick the file back up."
          >
            <div className="space-y-3">
              {deal.activities.length === 0 ? (
                <p className="text-sm text-slate-600">No activity yet.</p>
              ) : (
                deal.activities.map((activity) => (
                  <div
                    key={activity.id}
                    className="rounded-[20px] border border-slate-200 bg-slate-50/70 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-950">
                          {activity.title}
                        </p>
                        <p className="mt-1 text-sm text-slate-500">
                          {activity.createdBy} | {shortDate(activity.createdAt)}
                        </p>
                      </div>
                      <StageChip>{activity.kind}</StageChip>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      {activity.body}
                    </p>
                  </div>
                ))
              )}
            </div>
          </Panel>

          <Panel
            title="Next move"
            description="Keep one obvious recommendation visible for the operator."
          >
            {requestedDocuments[0] ? (
              <div>
                <p className="text-sm text-slate-500">Recommended next action</p>
                <p className="mt-2 text-lg font-semibold text-slate-950">
                  Follow up on {requestedDocuments[0].title}
                </p>
                <p className="mt-2 text-sm text-slate-600">
                  Requested by {requestedDocuments[0].requestedBy} on{" "}
                  {shortDate(requestedDocuments[0].createdAt)}.
                </p>
              </div>
            ) : deal.loanFile?.recommendedAction ? (
              <div>
                <p className="text-sm text-slate-500">Recommended next action</p>
                <p className="mt-2 text-lg font-semibold text-slate-950">
                  {deal.loanFile.recommendedAction}
                </p>
                <p className="mt-2 text-sm text-slate-600">
                  This recommendation comes from the submission summary.
                </p>
              </div>
            ) : openTasks[0] ? (
              <div>
                <p className="text-sm text-slate-500">Recommended next action</p>
                <p className="mt-2 text-lg font-semibold text-slate-950">
                  {openTasks[0].title}
                </p>
                <p className="mt-2 text-sm text-slate-600">
                  Owned by {openTasks[0].owner}, due {shortDate(openTasks[0].dueDate)}.
                </p>
              </div>
            ) : (
              <p className="text-sm text-slate-600">
                This deal has no open tasks right now.
              </p>
            )}
          </Panel>
        </div>
      </div>
    </AppFrame>
  );
}

function DetailItem({
  label,
  value,
  span,
}: {
  label: string;
  value: string;
  span?: string;
}) {
  return (
    <div
      className={`rounded-[20px] border border-slate-200 bg-slate-50/70 p-4 ${span ?? ""}`}
    >
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-2 text-sm font-medium leading-6 text-slate-900">{value}</p>
    </div>
  );
}

function BorrowerItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[20px] border border-slate-200 bg-slate-50/70 p-4">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-2 text-sm font-medium leading-6 text-slate-900">{value}</p>
    </div>
  );
}

function ProgressRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-[18px] border border-slate-200 bg-slate-50/70 px-4 py-3">
      <span className="text-sm text-slate-600">{label}</span>
      <strong className="text-sm text-slate-950">{value}</strong>
    </div>
  );
}

function InlineField({
  defaultValue,
  label,
  name,
  placeholder,
}: {
  defaultValue?: string;
  label: string;
  name: string;
  placeholder: string;
}) {
  return (
    <label className="grid gap-2 text-sm">
      <span className="font-medium text-slate-700">{label}</span>
      <input
        className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-emerald-400"
        defaultValue={defaultValue}
        name={name}
        placeholder={placeholder}
        required
      />
    </label>
  );
}
