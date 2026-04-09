import Link from "next/link";
import { PortalShell } from "@/components/portal-shell";
import { Panel, PrimaryLink, SecondaryLink, StageChip } from "@/components/ui";
import { compactCurrency, shortDate } from "@/lib/format";
import { getPortalIndexData } from "@/lib/portal";

export default async function PortalLandingPage() {
  const { deals, metrics } = await getPortalIndexData();

  return (
    <PortalShell>
      <section className="relative overflow-hidden rounded-[40px] border border-slate-900/10 bg-[linear-gradient(135deg,#0b130c_0%,#17381d_54%,#2a5b31_100%)] px-6 py-8 text-white shadow-[0_30px_80px_rgba(8,15,10,0.28)] md:px-8 md:py-10">
        <div className="pointer-events-none absolute inset-y-0 right-0 w-[42%] bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.22),transparent_48%),linear-gradient(180deg,transparent_0%,rgba(255,255,255,0.05)_100%)]" />
        <div className="relative grid gap-8 xl:grid-cols-[minmax(0,1.15fr)_minmax(300px,0.85fr)]">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/60">
              Secure borrower access
            </p>
            <h1 className="mt-4 text-4xl font-semibold tracking-[-0.05em] text-white sm:text-5xl lg:text-6xl">
              Track your loan file, upload documents, and see what happens next.
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-white/74 sm:text-lg">
              This portal gives clients one place to follow progress across underwriting,
              document collection, lender review, and closing without waiting on a manual
              status email.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <PrimaryLink href={deals[0] ? `/portal/${deals[0].id}` : "/portal"}>
                Open active file
              </PrimaryLink>
              <SecondaryLink href="/">Internal workspace</SecondaryLink>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
            <HeroStat
              label="Active files"
              value={`${metrics.totalDeals}`}
              detail="Residential and commercial deals visible in one client-facing queue."
            />
            <HeroStat
              label="Closing soon"
              value={`${metrics.closingSoonCount}`}
              detail="Files with target close dates inside the next two weeks."
            />
            <HeroStat
              label="Documents uploaded"
              value={`${metrics.totalUploadedDocuments}`}
              detail="Completed uploads stay attached to the deal and are visible immediately."
            />
          </div>
        </div>
      </section>

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <PortalMetric
          label="Borrower-facing files"
          value={`${metrics.totalDeals}`}
          detail="The portal is ready to hand to active clients."
        />
        <PortalMetric
          label="Pending uploads"
          value={`${metrics.totalRequestedDocuments}`}
          detail="Requested items clients can send directly from their file view."
        />
        <PortalMetric
          label="Volume in view"
          value={compactCurrency(metrics.totalVolume)}
          detail="Current loan amount represented across active seeded files."
        />
        <PortalMetric
          label="Secure workflow"
          value="Live"
          detail="Uploads and status changes revalidate the portal immediately."
        />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.25fr)_minmax(320px,0.75fr)]">
        <div className="grid gap-4">
          {deals.map((deal) => (
            <Link
              key={deal.id}
              className="group block rounded-[30px] border border-white/70 bg-white/78 p-5 shadow-[0_20px_55px_rgba(12,20,13,0.07)] backdrop-blur transition hover:-translate-y-0.5 hover:border-[var(--brand-silver)] hover:bg-white"
              href={`/portal/${deal.id}`}
            >
              <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <StageChip>{deal.stage.replaceAll("_", " ")}</StageChip>
                    <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                      {deal.dealType}
                    </span>
                  </div>
                  <h2 className="mt-4 text-2xl font-semibold tracking-[-0.04em] text-slate-950">
                    {deal.borrower.name}
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {deal.name} | {deal.market} | {deal.program}
                  </p>
                  <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
                    {deal.portalNextStep}
                  </p>
                </div>

                <div className="grid min-w-[260px] gap-3 text-sm text-slate-600">
                  <PortalRow label="Target close" value={shortDate(deal.targetCloseDate)} />
                  <PortalRow
                    label="Outstanding docs"
                    value={`${deal.requestedDocuments}`}
                  />
                  <PortalRow
                    label="Uploaded docs"
                    value={`${deal.uploadedDocuments}`}
                  />
                  <PortalRow
                    label="File progress"
                    value={`${deal.trackerSummary.overallPercent}%`}
                  />
                </div>
              </div>
            </Link>
          ))}
        </div>

        <div className="grid gap-4">
          <Panel
            title="What clients can do here"
            description="The portal keeps the experience narrow and operational."
          >
            <div className="space-y-3">
              <PortalChecklistItem text="Open a live status view for each active loan file." />
              <PortalChecklistItem text="See what stage the file is in and what Rehoboth is handling now." />
              <PortalChecklistItem text="Upload requested documents directly into the deal record." />
              <PortalChecklistItem text="Review recent updates without switching between texts and email threads." />
            </div>
          </Panel>

          <Panel
            title="Best first use"
            description="The portal landing should feel obvious in the first 10 seconds."
          >
            <p className="text-sm leading-6 text-slate-600">
              Start with the active file that has requested documents. That gives the client
              an immediate reason to use the portal and proves the upload workflow end to end.
            </p>
          </Panel>

          <Panel
            title="Support posture"
            description="This is still an MVP, so the copy stays honest."
          >
            <p className="text-sm leading-6 text-slate-600">
              Clients can follow status and upload files here. Rehoboth still owns lender
              coordination, internal underwriting, and closing communication behind the scenes.
            </p>
          </Panel>
        </div>
      </div>
    </PortalShell>
  );
}

function HeroStat({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-[24px] border border-white/14 bg-white/8 p-4 backdrop-blur">
      <p className="text-sm text-white/60">{label}</p>
      <p className="mt-2 text-3xl font-semibold tracking-[-0.05em] text-white">{value}</p>
      <p className="mt-2 text-sm leading-6 text-white/68">{detail}</p>
    </div>
  );
}

function PortalMetric({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-[28px] border border-white/70 bg-white/78 p-5 shadow-[0_18px_50px_rgba(12,20,13,0.07)] backdrop-blur">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-slate-950">
        {value}
      </p>
      <p className="mt-2 text-sm leading-6 text-slate-600">{detail}</p>
    </div>
  );
}

function PortalRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-[18px] border border-slate-200 bg-slate-50/75 px-4 py-3">
      <span className="text-slate-500">{label}</span>
      <strong className="text-slate-950">{value}</strong>
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
