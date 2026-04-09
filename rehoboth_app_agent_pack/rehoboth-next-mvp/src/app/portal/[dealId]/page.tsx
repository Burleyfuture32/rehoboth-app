import { notFound } from "next/navigation";
import { uploadDocumentAction } from "@/app/actions";
import { ClientStatusBar } from "@/components/client-status-bar";
import { PortalShell } from "@/components/portal-shell";
import { Panel, PrimaryLink, SecondaryLink, StageChip } from "@/components/ui";
import { currency, shortDate, shortDateTime } from "@/lib/format";
import { getPortalDealData } from "@/lib/portal";
import {
  formatStatusTrackerValue,
  getStatusTrackerLabel,
  getStatusTrackerTone,
} from "@/lib/status-tracker";

export default async function PortalDealPage({
  params,
  searchParams,
}: {
  params: Promise<{ dealId: string }>;
  searchParams: Promise<{ uploaded?: string }>;
}) {
  const [{ dealId }, pageParams] = await Promise.all([params, searchParams]);
  const portalData = await getPortalDealData(dealId);

  if (!portalData) {
    notFound();
  }

  const { deal, sections, requestedDocuments, uploadedDocuments, trackerSummary, contacts } =
    portalData;

  return (
    <PortalShell>
      <section
        className="relative overflow-hidden rounded-[40px] border px-6 py-8 md:px-8 md:py-10"
        style={{
          background: "var(--portal-page-hero-bg)",
          borderColor: "var(--portal-page-hero-border)",
          boxShadow: "var(--portal-page-hero-shadow)",
        }}
      >
        <div
          className="pointer-events-none absolute inset-y-0 right-0 w-[34%]"
          style={{ background: "var(--portal-page-hero-overlay)" }}
        />
        <div className="relative grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(300px,0.85fr)]">
          <div className="max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <StageChip>{deal.stage.replaceAll("_", " ")}</StageChip>
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                {deal.dealType}
              </span>
            </div>
            <h1 className="mt-4 text-4xl font-semibold tracking-[-0.05em] text-slate-950 sm:text-5xl">
              {deal.borrower.name}
            </h1>
            <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">
              {deal.name} for {deal.propertyAddress}. Use this page to follow progress,
              upload any open items, and see the next milestone on the file.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <PrimaryLink href="/portal">Back to portal</PrimaryLink>
              <SecondaryLink href="/">Internal workspace</SecondaryLink>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
            <SummaryTile label="Target close" value={shortDate(deal.targetCloseDate)} />
            <SummaryTile label="Loan amount" value={currency(deal.loanAmount)} />
            <SummaryTile
              label="Outstanding docs"
              value={`${requestedDocuments.length}`}
            />
            <SummaryTile
              label="File progress"
              value={`${trackerSummary.overallPercent}%`}
            />
          </div>
        </div>
      </section>

      {pageParams.uploaded ? (
        <div className="mt-6 rounded-[24px] border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-900">
          Document uploaded. The portal status refreshed for this file.
        </div>
      ) : null}

      <div className="mt-6">
        <ClientStatusBar deal={deal} className="mb-0 bg-white/86" />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
        <div className="grid gap-4">
          <Panel
            title="What happens next"
            description="The portal should always give the client one plain-language next step."
          >
            <p className="text-lg font-semibold text-slate-950">{portalData.portalNextStep}</p>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <InfoCard
                label="Program"
                value={deal.program}
                detail={`${deal.market} | ${deal.occupancy}`}
              />
              <InfoCard
                label="Submission status"
                value={
                  deal.loanFile?.submissionStatus.replaceAll("_", " ") ?? "Not ready"
                }
                detail={
                  deal.loanFile?.missingItemsSummary ??
                  "Use the milestone and document sections below for the current ask."
                }
              />
            </div>
          </Panel>

          <Panel
            title="Outstanding documents"
            description="Clients should be able to satisfy open requests directly from this page."
          >
            {requestedDocuments.length === 0 ? (
              <div className="rounded-[22px] border border-emerald-200 bg-emerald-50 px-5 py-5 text-sm leading-6 text-emerald-900">
                No documents are currently outstanding. Rehoboth has everything needed from
                the client side right now.
              </div>
            ) : (
              <div className="space-y-3">
                {requestedDocuments.map((document) => (
                  <div
                    key={document.id}
                    className="rounded-[24px] border border-amber-200 bg-amber-50/75 p-4"
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-700">
                          Requested by {document.requestedBy}
                        </p>
                        <h2 className="mt-2 text-lg font-semibold text-slate-950">
                          {document.title}
                        </h2>
                        <p className="mt-1 text-sm text-slate-600">{document.category}</p>
                        {document.notes ? (
                          <p className="mt-3 text-sm leading-6 text-slate-600">
                            {document.notes}
                          </p>
                        ) : null}
                      </div>

                      <form action={uploadDocumentAction} className="grid min-w-[260px] gap-3">
                        <input
                          name="documentRequestId"
                          type="hidden"
                          value={document.id}
                        />
                        <input
                          name="returnTo"
                          type="hidden"
                          value={`/portal/${deal.id}?uploaded=1`}
                        />
                        <label className="grid gap-2 text-sm">
                          <span className="font-medium text-slate-700">Upload file</span>
                          <input
                            className="block w-full min-w-0 max-w-full overflow-hidden rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 file:mr-3 file:rounded-full file:border-0 file:bg-slate-900 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-white"
                            name="file"
                            required
                            type="file"
                          />
                        </label>
                        <button
                          className="inline-flex items-center justify-center rounded-full bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-700"
                          type="submit"
                        >
                          Submit document
                        </button>
                      </form>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Panel>

          <Panel
            title="Uploaded documents"
            description="Everything already submitted remains visible on the client side."
          >
            {uploadedDocuments.length === 0 ? (
              <p className="text-sm leading-6 text-slate-600">
                No uploaded files are attached to this deal yet.
              </p>
            ) : (
              <div className="space-y-3">
                {uploadedDocuments.map((document) => (
                  <div
                    key={document.id}
                    className="flex flex-col gap-3 rounded-[22px] border border-slate-200 bg-slate-50/70 p-4 md:flex-row md:items-center md:justify-between"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-950">{document.title}</p>
                      <p className="mt-1 text-sm text-slate-500">
                        {document.uploadedAt
                          ? `Uploaded ${shortDateTime(document.uploadedAt)}`
                          : "Available in file"}
                      </p>
                    </div>
                    {document.uploadedFileUrl ? (
                      <a
                        className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-100"
                        href={document.uploadedFileUrl}
                        rel="noreferrer"
                        target="_blank"
                      >
                        Open file
                      </a>
                    ) : (
                      <span className="text-sm text-slate-500">Seeded document</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Panel>

          <Panel
            title="Recent updates"
            description="This is the running status feed the client can check without waiting for a separate summary."
          >
            <div className="space-y-3">
              {deal.activities.length === 0 ? (
                <p className="text-sm leading-6 text-slate-600">No updates posted yet.</p>
              ) : (
                deal.activities.map((activity) => (
                  <div
                    key={activity.id}
                    className="rounded-[22px] border border-slate-200 bg-slate-50/70 p-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-950">
                          {activity.title}
                        </p>
                        <p className="mt-1 text-sm text-slate-500">
                          {shortDateTime(activity.createdAt)} | {activity.createdBy}
                        </p>
                      </div>
                      <StageChip>{activity.kind}</StageChip>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-slate-600">{activity.body}</p>
                  </div>
                ))
              )}
            </div>
          </Panel>
        </div>

        <div className="grid gap-4">
          <Panel
            title="Milestone tracker"
            description="The full deal stays visible as a simple owner-by-owner checklist."
          >
            <div className="space-y-3">
              {sections.map((section) => (
                <div
                  key={section.id}
                  className="rounded-[22px] border border-slate-200 bg-slate-50/70 p-4"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] ${getStatusTrackerTone(section.status)}`}
                    >
                      {formatStatusTrackerValue(section.status)}
                    </span>
                    <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                      {section.percentComplete}% complete
                    </span>
                  </div>
                  <h2 className="mt-3 text-base font-semibold text-slate-950">
                    {getStatusTrackerLabel(section.sectionKey)}
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    {section.assignedToName ?? "Unassigned"}
                  </p>
                  <p className="mt-3 text-sm leading-6 text-slate-600">
                    {section.notes ?? "No note posted yet."}
                  </p>
                  {section.blockerReason ? (
                    <p className="mt-2 text-sm font-medium text-rose-700">
                      Watch item: {section.blockerReason}
                    </p>
                  ) : null}
                </div>
              ))}
            </div>
          </Panel>

          <Panel
            title="Rehoboth team"
            description="Clients should know who owns each stage without seeing the entire internal org chart."
          >
            <div className="space-y-3">
              {contacts.map((contact) => (
                <div
                  key={contact.role}
                  className="rounded-[22px] border border-slate-200 bg-slate-50/70 p-4"
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    {contact.role}
                  </p>
                  <p className="mt-2 text-base font-semibold text-slate-950">
                    {contact.owner}
                  </p>
                  {contact.company ? (
                    <p className="mt-1 text-sm text-slate-500">{contact.company}</p>
                  ) : null}
                  <p
                    className={`mt-3 inline-flex rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] ${getStatusTrackerTone(contact.status)}`}
                  >
                    {formatStatusTrackerValue(contact.status)}
                  </p>
                </div>
              ))}
            </div>
          </Panel>

          <Panel
            title="Support notes"
            description="A narrow support pattern is enough for the MVP."
          >
            <div className="space-y-3 text-sm leading-6 text-slate-600">
              <p>
                Use this portal for secure document uploads and current file status. Rehoboth
                will continue to handle lender outreach, underwriting coordination, and final
                closing communication.
              </p>
              <p>
                If a requested item is unclear, follow up with your Rehoboth contact before
                uploading a replacement document.
              </p>
            </div>
          </Panel>
        </div>
      </div>
    </PortalShell>
  );
}

function SummaryTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[24px] border border-slate-200 bg-white/82 p-4 shadow-[0_16px_42px_rgba(12,20,13,0.06)]">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-slate-950">
        {value}
      </p>
    </div>
  );
}

function InfoCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-[22px] border border-slate-200 bg-slate-50/70 p-4">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-2 text-base font-semibold text-slate-950">{value}</p>
      <p className="mt-2 text-sm leading-6 text-slate-600">{detail}</p>
    </div>
  );
}
