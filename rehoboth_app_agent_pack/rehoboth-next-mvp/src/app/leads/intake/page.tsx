import Link from "next/link";
import { AppFrame } from "@/components/app-frame";
import { PageHeader, Panel, PrimaryLink, SecondaryLink } from "@/components/ui";
import { createLeadAction } from "@/app/actions";
import { leadPresets } from "@/lib/lead-presets";

export default async function LeadIntakePage({
  searchParams,
}: {
  searchParams: Promise<{ preset?: string; error?: string }>;
}) {
  const params = await searchParams;
  const presetKey = params.preset === "cre" ? "cre" : "residential";
  const preset = leadPresets[presetKey];

  return (
    <AppFrame>
      <PageHeader
        eyebrow="Lead intake"
        title="Capture the basics before anything gets complex"
        description="This first form is intentionally short. It creates the borrower and deal in local SQLite, then returns to the dashboard so investors can see the workflow immediately."
        actions={
          <>
            <PrimaryLink href="/leads/intake?preset=residential">
              Residential example
            </PrimaryLink>
            <SecondaryLink href="/leads/intake?preset=cre">
              CRE example
            </SecondaryLink>
          </>
        }
      />

      {params.error ? (
        <div className="mb-6 rounded-[24px] border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-900">
          Borrower name, deal name, and property address are required.
        </div>
      ) : null}

      <Panel
        title="New lead"
        description="Use the seeded example as-is for the demo, or edit a few fields live."
      >
        <form action={createLeadAction} className="grid gap-4 md:grid-cols-2">
          <label className="text-sm font-medium text-slate-700">
            Borrower name
            <input
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none ring-0 transition focus:border-emerald-400"
              defaultValue={preset.borrowerName}
              name="borrowerName"
            />
          </label>

          <label className="text-sm font-medium text-slate-700">
            Entity type
            <input
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none ring-0 transition focus:border-emerald-400"
              defaultValue={preset.entityType}
              name="entityType"
            />
          </label>

          <label className="text-sm font-medium text-slate-700">
            Email
            <input
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none ring-0 transition focus:border-emerald-400"
              defaultValue={preset.email}
              name="email"
            />
          </label>

          <label className="text-sm font-medium text-slate-700">
            Phone
            <input
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none ring-0 transition focus:border-emerald-400"
              defaultValue={preset.phone}
              name="phone"
            />
          </label>

          <label className="text-sm font-medium text-slate-700">
            Deal name
            <input
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none ring-0 transition focus:border-emerald-400"
              defaultValue={preset.dealName}
              name="dealName"
            />
          </label>

          <label className="text-sm font-medium text-slate-700">
            Deal type
            <select
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none ring-0 transition focus:border-emerald-400"
              defaultValue={preset.dealType}
              name="dealType"
            >
              <option value="RESIDENTIAL">Residential</option>
              <option value="CRE">CRE</option>
            </select>
          </label>

          <label className="text-sm font-medium text-slate-700">
            Program
            <input
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none ring-0 transition focus:border-emerald-400"
              defaultValue={preset.program}
              name="program"
            />
          </label>

          <label className="text-sm font-medium text-slate-700">
            Source
            <input
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none ring-0 transition focus:border-emerald-400"
              defaultValue={preset.source}
              name="source"
            />
          </label>

          <label className="text-sm font-medium text-slate-700 md:col-span-2">
            Property address
            <input
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none ring-0 transition focus:border-emerald-400"
              defaultValue={preset.propertyAddress}
              name="propertyAddress"
            />
          </label>

          <label className="text-sm font-medium text-slate-700">
            Market
            <input
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none ring-0 transition focus:border-emerald-400"
              defaultValue={preset.market}
              name="market"
            />
          </label>

          <label className="text-sm font-medium text-slate-700">
            Occupancy
            <input
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none ring-0 transition focus:border-emerald-400"
              defaultValue={preset.occupancy}
              name="occupancy"
            />
          </label>

          <label className="text-sm font-medium text-slate-700">
            Loan amount
            <input
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none ring-0 transition focus:border-emerald-400"
              defaultValue={preset.loanAmount}
              min={0}
              name="loanAmount"
              type="number"
            />
          </label>

          <label className="text-sm font-medium text-slate-700">
            Estimated value
            <input
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none ring-0 transition focus:border-emerald-400"
              defaultValue={preset.estimatedValue}
              min={0}
              name="estimatedValue"
              type="number"
            />
          </label>

          <label className="text-sm font-medium text-slate-700 md:col-span-2">
            Notes
            <textarea
              className="mt-2 min-h-32 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none ring-0 transition focus:border-emerald-400"
              defaultValue={preset.notes}
              name="notes"
            />
          </label>

          <div className="flex flex-col gap-3 border-t border-slate-200 pt-4 md:col-span-2 md:flex-row md:items-center md:justify-between">
            <p className="max-w-2xl text-sm leading-6 text-slate-500">
              Submitting this form creates the borrower and deal in Prisma-backed
              SQLite demo data, then returns to the dashboard so the new lead is
              visible immediately.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/"
                className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
              >
                Back to dashboard
              </Link>
              <button
                className="inline-flex items-center justify-center rounded-full bg-emerald-700 px-5 py-3 text-sm font-medium text-white transition hover:bg-emerald-800"
                type="submit"
              >
                Create lead
              </button>
            </div>
          </div>
        </form>
      </Panel>
    </AppFrame>
  );
}
