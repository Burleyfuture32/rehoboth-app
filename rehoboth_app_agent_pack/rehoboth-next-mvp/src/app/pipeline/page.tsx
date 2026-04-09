import Link from "next/link";
import { advanceDealStageAction } from "@/app/actions";
import { AppFrame } from "@/components/app-frame";
import {
  PageHeader,
  Panel,
  PrimaryLink,
  StageChip,
} from "@/components/ui";
import { currency, shortDate } from "@/lib/format";
import { getPipelineData } from "@/lib/pipeline";

export default async function PipelinePage({
  searchParams,
}: {
  searchParams: Promise<{ created?: string }>;
}) {
  const [columns, params] = await Promise.all([getPipelineData(), searchParams]);
  const createdDealId = params.created;

  return (
    <AppFrame>
      <PageHeader
        eyebrow="Pipeline board"
        title="The board stays obvious for low-tech operators"
        description="Each column answers one question: what stage is the deal in, who is the borrower, and what is the next move."
        actions={<PrimaryLink href="/leads/intake">Add new lead</PrimaryLink>}
      />

      {createdDealId ? (
        <div className="mb-6 rounded-[24px] border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-900">
          New lead added. It now appears in the pipeline board.
        </div>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-5">
        {columns.map((column) => (
          <Panel
            key={column.stage}
            title={column.stage.replaceAll("_", " ")}
            description={`${column.deals.length} deal${column.deals.length === 1 ? "" : "s"}`}
          >
            <div className="space-y-3">
              {column.deals.length === 0 ? (
                <div className="rounded-[20px] border border-dashed border-slate-200 bg-slate-50/60 px-4 py-6 text-sm text-slate-500">
                  No deals in this stage.
                </div>
              ) : null}

              {column.deals.map((deal) => (
                <article
                  key={deal.id}
                  className={`rounded-[22px] border p-4 ${
                    createdDealId === deal.id
                      ? "border-emerald-300 bg-emerald-50/80"
                      : "border-slate-200 bg-slate-50/70"
                  }`}
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <StageChip>{deal.dealType}</StageChip>
                    <span className="text-xs font-medium uppercase tracking-[0.16em] text-slate-500">
                      {deal.program}
                    </span>
                  </div>
                  <h3 className="mt-3 text-base font-semibold text-slate-950">
                    {deal.name}
                  </h3>
                  <p className="mt-1 text-sm text-slate-600">
                    {deal.borrower.name}
                  </p>
                  <dl className="mt-4 grid gap-2 text-sm text-slate-600">
                    <div>
                      <dt className="text-slate-500">Loan amount</dt>
                      <dd className="font-medium text-slate-900">
                        {currency(deal.loanAmount)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-slate-500">Target close</dt>
                      <dd className="font-medium text-slate-900">
                        {shortDate(deal.targetCloseDate)}
                      </dd>
                    </div>
                    {deal.tasks[0] ? (
                      <div>
                        <dt className="text-slate-500">Next task</dt>
                        <dd className="font-medium text-slate-900">
                          {deal.tasks[0].title}
                        </dd>
                      </div>
                    ) : null}
                  </dl>
                  <div className="mt-4 flex flex-col gap-2">
                    <Link
                      className="inline-flex w-full items-center justify-center rounded-full bg-emerald-700 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-emerald-800"
                      href={`/deals/${deal.id}`}
                    >
                      Open workspace
                    </Link>
                    <form action={advanceDealStageAction}>
                      <input name="dealId" type="hidden" value={deal.id} />
                      <button
                        className="inline-flex w-full items-center justify-center rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-100"
                        type="submit"
                      >
                        Advance stage
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
