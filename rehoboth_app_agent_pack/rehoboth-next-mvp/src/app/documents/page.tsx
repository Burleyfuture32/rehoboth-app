import Link from "next/link";
import { requestDocumentAction, uploadDocumentAction } from "@/app/actions";
import { AppFrame } from "@/components/app-frame";
import { ClientStatusBar } from "@/components/client-status-bar";
import {
  PageHeader,
  Panel,
  PrimaryLink,
  SecondaryLink,
} from "@/components/ui";
import { shortDate } from "@/lib/format";
import { getDocumentCenterData } from "@/lib/documents";

const statusTone = {
  REQUESTED: "bg-amber-50 text-amber-800",
  UPLOADED: "bg-emerald-50 text-emerald-800",
} as const;

export default async function DocumentsPage({
  searchParams,
}: {
  searchParams: Promise<{ dealId?: string; requested?: string; uploaded?: string }>;
}) {
  const params = await searchParams;
  const { dealOptions, deals, metrics, selectedDeal } = await getDocumentCenterData(
    params.dealId,
  );

  return (
    <AppFrame>
      <PageHeader
        eyebrow="Document center"
        title="Request and upload files without adding workflow clutter"
        description="The document view stays beginner-friendly: ask for one file, upload one file, and keep everything tied to the deal workspace."
        actions={
          <>
            {selectedDeal ? (
              <PrimaryLink href={`/deals/${selectedDeal.id}`}>Back to workspace</PrimaryLink>
            ) : (
              <PrimaryLink href="/pipeline">Back to pipeline</PrimaryLink>
            )}
            <SecondaryLink href="/documents">View all documents</SecondaryLink>
          </>
        }
      />

      {selectedDeal ? <ClientStatusBar deal={selectedDeal} /> : null}

      {params.requested ? (
        <FlashBanner message="Document request added." tone="request" />
      ) : null}
      {params.uploaded ? (
        <FlashBanner message="File uploaded locally for the demo." tone="upload" />
      ) : null}

      <div className="grid gap-4 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
        <Panel
          title="Request a document"
          description="Use this when a borrower or broker sends the file later. The request appears immediately inside the deal workspace."
        >
          <form action={requestDocumentAction} className="grid gap-4">
            <input
              name="returnTo"
              type="hidden"
              value={
                selectedDeal
                  ? `/documents?dealId=${selectedDeal.id}&requested=1`
                  : "/documents?requested=1"
              }
            />

            {selectedDeal ? (
              <>
                <input name="dealId" type="hidden" value={selectedDeal.id} />
                <ReadOnlyField
                  label="Deal"
                  value={`${selectedDeal.name} | ${selectedDeal.borrower.name}`}
                />
              </>
            ) : (
              <label className="grid gap-2 text-sm">
                <span className="font-medium text-slate-700">Deal</span>
                <select
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-emerald-400"
                  defaultValue=""
                  name="dealId"
                  required
                >
                  <option disabled value="">
                    Select a deal
                  </option>
                  {dealOptions.map((deal) => (
                    <option key={deal.id} value={deal.id}>
                      {deal.name} | {deal.borrower.name}
                    </option>
                  ))}
                </select>
              </label>
            )}

            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                defaultValue=""
                label="Document name"
                name="title"
                placeholder="Most recent bank statements"
              />
              <FormField
                defaultValue=""
                label="Category"
                name="category"
                placeholder="Financials"
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                defaultValue="Nora Wells"
                label="Requested by"
                name="requestedBy"
                placeholder="Nora Wells"
              />
              <label className="grid gap-2 text-sm">
                <span className="font-medium text-slate-700">Notes</span>
                <textarea
                  className="min-h-28 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-emerald-400"
                  name="notes"
                  placeholder="Short note the borrower can understand."
                />
              </label>
            </div>

            <button
              className="inline-flex items-center justify-center rounded-full bg-emerald-700 px-5 py-3 text-sm font-medium text-white transition hover:bg-emerald-800"
              type="submit"
            >
              Add request
            </button>
          </form>
        </Panel>

        <Panel
          title="Document health"
          description="Enough detail for the investor demo without pretending this is a full document management suite."
        >
          <div className="grid gap-3 md:grid-cols-3">
            <MetricTile label="Requested" value={`${metrics.requested}`} />
            <MetricTile label="Uploaded" value={`${metrics.uploaded}`} />
            <MetricTile label="Deals shown" value={`${metrics.totalDeals}`} />
          </div>
          <div className="mt-4 rounded-[20px] border border-slate-200 bg-slate-50/70 p-4 text-sm text-slate-600">
            Files uploaded from this screen are saved locally to
            {" "}
            <code>public/demo-uploads</code>
            {" "}
            so the demo runs offline with SQLite and the local filesystem.
          </div>
        </Panel>
      </div>

      <div className="mt-4 space-y-4">
        {deals.map((deal) => (
          <Panel
            key={deal.id}
            title={deal.name}
            description={`${deal.borrower.name} | ${deal.program} | ${deal.market}`}
            action={
              <Link
                className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-100"
                href={`/deals/${deal.id}`}
              >
                Open workspace
              </Link>
            }
          >
            <div className="space-y-3">
              {deal.documentRequests.length === 0 ? (
                <div className="rounded-[20px] border border-dashed border-slate-200 bg-slate-50/60 px-4 py-6 text-sm text-slate-500">
                  No document requests yet.
                </div>
              ) : null}

              {deal.documentRequests.map((document) => (
                <article
                  key={document.id}
                  className="grid gap-4 rounded-[22px] border border-slate-200 bg-slate-50/70 p-4 xl:grid-cols-[minmax(0,1.25fr)_minmax(0,200px)]"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] ${statusTone[document.status]}`}
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

                  <div className="min-w-0 text-sm text-slate-600">
                    <p className="font-medium text-slate-900">Current file</p>
                    {document.uploadedFileUrl ? (
                      <div className="mt-2 space-y-2">
                        <p>{document.uploadedFileName}</p>
                        <a
                          className="inline-flex items-center rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-100"
                          href={document.uploadedFileUrl}
                          rel="noreferrer"
                          target="_blank"
                        >
                          Open file
                        </a>
                      </div>
                    ) : document.status === "UPLOADED" ? (
                      <div className="mt-2 space-y-2">
                        <p>{document.uploadedFileName ?? "Uploaded source file"}</p>
                        <p className="text-slate-500">
                          Seeded from the source file set for the demo.
                        </p>
                      </div>
                    ) : (
                      <p className="mt-2">Waiting on upload.</p>
                    )}
                  </div>

                  <div className="xl:col-span-2">
                    <form
                      action={uploadDocumentAction}
                      className="grid min-w-0 gap-3 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-end"
                    >
                      <input name="documentRequestId" type="hidden" value={document.id} />
                      <input
                        name="returnTo"
                        type="hidden"
                        value={
                          selectedDeal
                            ? `/documents?dealId=${deal.id}&uploaded=1`
                            : "/documents?uploaded=1"
                        }
                      />
                      <label className="grid min-w-0 gap-2 text-sm">
                        <span className="font-medium text-slate-700">
                          Upload replacement or new file
                        </span>
                        <input
                          className="block w-full min-w-0 max-w-full overflow-hidden rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 file:mr-3 file:rounded-full file:border-0 file:bg-slate-900 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-white"
                          name="file"
                          required={document.status === "REQUESTED"}
                          type="file"
                        />
                      </label>
                      <button
                        className="inline-flex items-center justify-center rounded-full bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-700 xl:self-end"
                        type="submit"
                      >
                        Upload file
                      </button>
                    </form>
                  </div>
                </article>
              ))}
            </div>
          </Panel>
        ))}
      </div>
    </AppFrame>
  );
}

function FlashBanner({
  message,
  tone,
}: {
  message: string;
  tone: "request" | "upload";
}) {
  return (
    <div
      className={`mb-6 rounded-[24px] px-5 py-4 text-sm ${
        tone === "request"
          ? "border border-amber-200 bg-amber-50 text-amber-900"
          : "border border-emerald-200 bg-emerald-50 text-emerald-900"
      }`}
    >
      {message}
    </div>
  );
}

function FormField({
  defaultValue,
  label,
  name,
  placeholder,
}: {
  defaultValue: string;
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

function MetricTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[20px] border border-slate-200 bg-slate-50/70 p-4">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-slate-950">
        {value}
      </p>
    </div>
  );
}

function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[20px] border border-slate-200 bg-slate-50/70 p-4">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-2 text-sm font-medium text-slate-900">{value}</p>
    </div>
  );
}
