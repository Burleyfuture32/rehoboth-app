import {
  CommunicationChannel,
  CommunicationDirection,
} from "@prisma/client";
import { notFound } from "next/navigation";
import { addCommunicationAction } from "@/app/actions";
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
import { shortDateTime } from "@/lib/format";
import { getCommunicationsPageData } from "@/lib/communications";

const channelTone = {
  EMAIL: "bg-sky-50 text-sky-900",
  TEXT: "bg-emerald-50 text-emerald-900",
  CALL: "bg-amber-50 text-amber-900",
} as const;

const directionTone = {
  INBOUND: "bg-slate-100 text-slate-700",
  OUTBOUND: "bg-slate-900 text-white",
} as const;

export default async function CommunicationsPage({
  params,
  searchParams,
}: {
  params: Promise<{ dealId: string }>;
  searchParams: Promise<{ logged?: string }>;
}) {
  const [{ dealId }, pageParams] = await Promise.all([params, searchParams]);
  const data = await getCommunicationsPageData(dealId);

  if (!data) {
    notFound();
  }

  const { counts, deal } = data;

  return (
    <AppFrame>
      <PageHeader
        eyebrow="Client communications"
        title={`${deal.borrower.name} communications hub`}
        description="This is the first CRM window inside the lending app: email, text, and call tracking in one place, tied directly to the file."
        actions={
          <>
            <PrimaryLink href={`/deals/${deal.id}`}>Back to workspace</PrimaryLink>
            <SecondaryLink href={`mailto:${deal.borrower.email}`}>
              Open email app
            </SecondaryLink>
            <SecondaryLink href={`sms:${deal.borrower.phone}`}>
              Open text app
            </SecondaryLink>
            <SecondaryLink href={`tel:${deal.borrower.phone}`}>
              Call borrower
            </SecondaryLink>
          </>
        }
      />

      <ClientStatusBar deal={deal} />
      <DealTabs current="communications" dealId={deal.id} />

      {pageParams.logged ? (
        <div className="mb-6 rounded-[24px] border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-900">
          Communication saved to the client timeline.
        </div>
      ) : null}

      <div className="mb-4 grid gap-4 md:grid-cols-4">
        <SummaryTile label="Borrower email" value={deal.borrower.email} />
        <SummaryTile label="Borrower phone" value={deal.borrower.phone} />
        <SummaryTile
          label="Total touches"
          value={`${deal.communicationLogs.length}`}
        />
        <SummaryTile
          label="Last touch"
          value={
            deal.communicationLogs[0]
              ? shortDateTime(deal.communicationLogs[0].createdAt)
              : "No log yet"
          }
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <CommunicationComposer
          channel={CommunicationChannel.EMAIL}
          contactName={deal.borrower.name}
          contactValue={deal.borrower.email}
          createdBy="Nora Wells"
          dealId={deal.id}
          outcomePlaceholder="What came back or what is expected next?"
          subjectPlaceholder="Updated bank statements still needed"
          messagePlaceholder="Sent borrower a short email asking for the next document or confirming underwriting timing."
        />
        <CommunicationComposer
          channel={CommunicationChannel.TEXT}
          contactName={deal.borrower.name}
          contactValue={deal.borrower.phone}
          createdBy="Marcus Reed"
          dealId={deal.id}
          outcomePlaceholder="Reply expected later today"
          subjectPlaceholder="Short reminder"
          messagePlaceholder="Texted borrower a simple reminder or quick update they can answer from their phone."
        />
        <CommunicationComposer
          channel={CommunicationChannel.CALL}
          contactName={deal.borrower.name}
          contactValue={deal.borrower.phone}
          createdBy="Avery Shaw"
          dealId={deal.id}
          outcomePlaceholder="Left voicemail, spoke live, callback set, etc."
          subjectPlaceholder="Call topic"
          messagePlaceholder="Summarize the call, what was discussed, and the exact next step."
        />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_320px]">
        <Panel
          title="Communication log"
          description="Every email, text, and call lands in one timeline so the next person can pick the file up cold."
        >
          <div className="space-y-3">
            {deal.communicationLogs.length === 0 ? (
              <div className="rounded-[20px] border border-dashed border-slate-200 bg-slate-50/60 px-4 py-6 text-sm text-slate-500">
                No communication log yet.
              </div>
            ) : null}

            {deal.communicationLogs.map((entry) => (
              <article
                key={entry.id}
                className="rounded-[22px] border border-slate-200 bg-slate-50/70 p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] ${channelTone[entry.channel]}`}
                    >
                      {entry.channel}
                    </span>
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] ${directionTone[entry.direction]}`}
                    >
                      {entry.direction}
                    </span>
                    {entry.contactName ? <StageChip>{entry.contactName}</StageChip> : null}
                  </div>
                  <p className="text-sm text-slate-500">
                    {shortDateTime(entry.createdAt)}
                  </p>
                </div>

                {entry.subject ? (
                  <h3 className="mt-3 text-base font-semibold text-slate-950">
                    {entry.subject}
                  </h3>
                ) : null}
                <p className="mt-2 text-sm leading-6 text-slate-700">{entry.message}</p>

                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  <DetailCard label="Logged by" value={entry.createdBy} />
                  <DetailCard
                    label="Contact"
                    value={entry.contactValue ?? "Not recorded"}
                  />
                </div>

                {entry.outcome ? (
                  <div className="mt-3 rounded-[18px] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                      Outcome
                    </p>
                    <p className="mt-2">{entry.outcome}</p>
                  </div>
                ) : null}
              </article>
            ))}
          </div>
        </Panel>

        <Panel
          title="Channel mix"
          description="Simple CRM health for this one file."
        >
          <div className="space-y-3">
            {counts.map((item) => (
              <div
                key={item.channel}
                className="flex items-center justify-between rounded-[18px] border border-slate-200 bg-slate-50/70 px-4 py-3"
              >
                <span className="text-sm text-slate-600">
                  {item.channel.replaceAll("_", " ")}
                </span>
                <strong className="text-sm text-slate-950">{item.count}</strong>
              </div>
            ))}
            <div className="rounded-[20px] border border-slate-200 bg-white p-4 text-sm leading-6 text-slate-600">
              Keep this page for relationship follow-up, borrower updates, lender calls,
              and any short contact history that would normally get lost in email and text.
            </div>
          </div>
        </Panel>
      </div>
    </AppFrame>
  );
}

function CommunicationComposer({
  channel,
  dealId,
  contactName,
  contactValue,
  createdBy,
  messagePlaceholder,
  outcomePlaceholder,
  subjectPlaceholder,
}: {
  channel: CommunicationChannel;
  dealId: string;
  contactName: string;
  contactValue: string;
  createdBy: string;
  messagePlaceholder: string;
  outcomePlaceholder: string;
  subjectPlaceholder: string;
}) {
  return (
    <Panel
      title={`Log ${channel.toLowerCase()}`}
      description={`Save a ${channel.toLowerCase()} touchpoint inside the file without leaving the app.`}
      action={
        <span
          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] ${channelTone[channel]}`}
        >
          {channel}
        </span>
      }
    >
      <form action={addCommunicationAction} className="grid gap-4">
        <input name="dealId" type="hidden" value={dealId} />
        <input name="channel" type="hidden" value={channel} />
        <input
          name="returnTo"
          type="hidden"
          value={`/deals/${dealId}/communications?logged=1`}
        />

        <SelectField
          defaultValue={CommunicationDirection.OUTBOUND}
          label="Direction"
          name="direction"
          options={Object.values(CommunicationDirection)}
        />
        <Field defaultValue={contactName} label="Contact name" name="contactName" />
        <Field defaultValue={contactValue} label="Email / phone" name="contactValue" />
        <Field defaultValue={createdBy} label="Logged by" name="createdBy" />
        <Field
          defaultValue=""
          label={channel === CommunicationChannel.CALL ? "Call topic" : "Subject"}
          name="subject"
          placeholder={subjectPlaceholder}
          required={false}
        />
        <TextAreaField
          defaultValue=""
          label={channel === CommunicationChannel.CALL ? "Call summary" : "Message"}
          minHeight="min-h-28"
          name="message"
          placeholder={messagePlaceholder}
        />
        <TextAreaField
          defaultValue=""
          label="Outcome / next response"
          minHeight="min-h-20"
          name="outcome"
          placeholder={outcomePlaceholder}
          required={false}
        />
        <button
          className="inline-flex items-center justify-center rounded-full bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-700"
          type="submit"
        >
          Save {channel.toLowerCase()} log
        </button>
      </form>
    </Panel>
  );
}

function SummaryTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[20px] border border-slate-200 bg-slate-50/70 p-4">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-2 text-sm font-semibold leading-6 text-slate-950">{value}</p>
    </div>
  );
}

function Field({
  label,
  name,
  defaultValue,
  placeholder,
  required,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <label className="grid gap-2 text-sm">
      <span className="font-medium text-slate-700">{label}</span>
      <input
        className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-emerald-400"
        defaultValue={defaultValue}
        name={name}
        placeholder={placeholder}
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
  placeholder,
  required,
}: {
  label: string;
  name: string;
  defaultValue: string;
  minHeight: string;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <label className="grid gap-2 text-sm">
      <span className="font-medium text-slate-700">{label}</span>
      <textarea
        className={`${minHeight} rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-emerald-400`}
        defaultValue={defaultValue}
        name={name}
        placeholder={placeholder}
        required={required ?? true}
      />
    </label>
  );
}

function DetailCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[18px] border border-slate-200 bg-white px-4 py-3">
      <p className="text-xs uppercase tracking-[0.16em] text-slate-500">{label}</p>
      <p className="mt-2 text-sm font-medium text-slate-900">{value}</p>
    </div>
  );
}
