import { AppFrame } from "@/components/app-frame";
import { MetricCard, PageHeader, Panel, PrimaryLink, SecondaryLink, StageChip } from "@/components/ui";
import { shortDate, shortDateTime } from "@/lib/format";
import { getBulkActionsData } from "@/lib/bulk-actions";

const lenderStatusTone = {
  TARGETED: "bg-slate-100 text-slate-700",
  SUBMITTED: "bg-amber-50 text-amber-800",
  QUOTE_RECEIVED: "bg-emerald-50 text-emerald-800",
  PASSED: "bg-slate-200 text-slate-700",
} as const;

const submissionTone = {
  NOT_READY: "bg-rose-50 text-rose-800",
  READY_TO_SUBMIT: "bg-amber-50 text-amber-800",
  SUBMITTED: "bg-emerald-50 text-emerald-800",
} as const;

export default async function BulkActionsPage() {
  const { metrics, documentQueues, dueTasks, submissionReadyDeals, lenderFollowUps } =
    await getBulkActionsData();

  return (
    <AppFrame>
      <PageHeader
        eyebrow="Bulk actions"
        title="Work the biggest queues from one screen"
        description="This page groups the obvious batch work: document follow-ups, due tasks, lender nudges, and files that look ready for a clean submission push."
        actions={
          <>
            <PrimaryLink href="/tasks">Open task center</PrimaryLink>
            <SecondaryLink href="/documents">Open documents</SecondaryLink>
            <SecondaryLink href="/workflows">Open workflows</SecondaryLink>
          </>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Document queues"
          value={`${metrics.dealsWithQueues}`}
          detail="Deals with at least one requested file still outstanding."
        />
        <MetricCard
          label="Due now"
          value={`${metrics.dueTasks}`}
          detail="Open tasks due within the next three days."
        />
        <MetricCard
          label="Ready to submit"
          value={`${metrics.readyDeals}`}
          detail="Files that are either marked ready or nearly ready for lender handoff."
        />
        <MetricCard
          label="Lender follow-ups"
          value={`${metrics.lenderFollowUps}`}
          detail="Capital-source matches still waiting on outbound motion or response."
        />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1.02fr)_minmax(0,0.98fr)]">
        <Panel
          title="Document follow-up queue"
          description="Use this when the team needs to chase missing borrower files in batches."
        >
          <div className="space-y-3">
            {documentQueues.length === 0 ? (
              <EmptyState message="No deals are waiting on requested documents right now." />
            ) : (
              documentQueues.map((deal) => (
                <article
                  key={deal.id}
                  className="rounded-[22px] border border-slate-200 bg-slate-50/70 p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <StageChip>{deal.stage.replaceAll("_", " ")}</StageChip>
                        <span className="text-xs font-medium uppercase tracking-[0.16em] text-slate-500">
                          {deal.requestedCount} requested
                        </span>
                      </div>
                      <h3 className="mt-3 text-base font-semibold text-slate-950">
                        {deal.name}
                      </h3>
                      <p className="mt-1 text-sm text-slate-600">{deal.borrowerName}</p>
                    </div>
                    <p className="text-sm text-slate-500">
                      Oldest ask {shortDate(deal.oldestRequestDate)}
                    </p>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-slate-600">
                    Next file to chase: {deal.nextDocumentTitle}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-3">
                    <SecondaryLink href={`/documents?dealId=${deal.id}`}>
                      Open documents
                    </SecondaryLink>
                    <SecondaryLink href={`/deals/${deal.id}`}>
                      Open workspace
                    </SecondaryLink>
                  </div>
                </article>
              ))
            )}
          </div>
        </Panel>

        <Panel
          title="Tasks due now"
          description="A compact batch list for operators who want to clear near-term work first."
        >
          <div className="space-y-3">
            {dueTasks.length === 0 ? (
              <EmptyState message="No open tasks are due within the next three days." />
            ) : (
              dueTasks.map((task) => (
                <article
                  key={task.id}
                  className="rounded-[22px] border border-slate-200 bg-slate-50/70 p-4"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <StageChip>{task.deal.dealType}</StageChip>
                    <span className="text-xs font-medium uppercase tracking-[0.16em] text-slate-500">
                      {task.priority}
                    </span>
                  </div>
                  <h3 className="mt-3 text-base font-semibold text-slate-950">
                    {task.title}
                  </h3>
                  <p className="mt-1 text-sm text-slate-600">
                    {task.deal.name} | {task.deal.borrower.name}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    {task.category} | owner: {task.owner} | due {shortDate(task.dueDate)}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-3">
                    <SecondaryLink href={`/deals/${task.deal.id}`}>
                      Open deal
                    </SecondaryLink>
                    <SecondaryLink href="/tasks">Open task center</SecondaryLink>
                  </div>
                </article>
              ))
            )}
          </div>
        </Panel>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,0.98fr)_minmax(0,1.02fr)]">
        <Panel
          title="Submission-ready files"
          description="These files already look close enough for a lender handoff review."
        >
          <div className="space-y-3">
            {submissionReadyDeals.length === 0 ? (
              <EmptyState message="No files are clearly ready for a submission push yet." />
            ) : (
              submissionReadyDeals.map((deal) => (
                <article
                  key={deal.id}
                  className="rounded-[22px] border border-slate-200 bg-slate-50/70 p-4"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] ${submissionTone[deal.submissionStatus]}`}
                    >
                      {deal.submissionStatus.replaceAll("_", " ")}
                    </span>
                    <StageChip>{deal.stage.replaceAll("_", " ")}</StageChip>
                  </div>
                  <h3 className="mt-3 text-base font-semibold text-slate-950">
                    {deal.name}
                  </h3>
                  <p className="mt-1 text-sm text-slate-600">{deal.borrowerName}</p>
                  <p className="mt-3 text-sm leading-6 text-slate-600">
                    {deal.recommendedAction}
                  </p>
                  <div className="mt-3 grid gap-3 md:grid-cols-2">
                    <InfoTile label="Open tasks" value={`${deal.openTasks}`} />
                    <InfoTile label="Capital sources" value={`${deal.capitalSources}`} />
                  </div>
                  <div className="mt-4 flex flex-wrap gap-3">
                    <SecondaryLink href={`/deals/${deal.id}/summary`}>
                      Open summary
                    </SecondaryLink>
                    <SecondaryLink href={`/deals/${deal.id}`}>
                      Open workspace
                    </SecondaryLink>
                  </div>
                </article>
              ))
            )}
          </div>
        </Panel>

        <Panel
          title="Lender follow-ups"
          description="This queue keeps targeted and submitted lender matches from going stale."
        >
          <div className="space-y-3">
            {lenderFollowUps.length === 0 ? (
              <EmptyState message="No lender follow-ups are waiting right now." />
            ) : (
              lenderFollowUps.map((match) => (
                <article
                  key={match.id}
                  className="rounded-[22px] border border-slate-200 bg-slate-50/70 p-4"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] ${lenderStatusTone[match.status]}`}
                    >
                      {match.status.replaceAll("_", " ")}
                    </span>
                    <StageChip>{match.deal.dealType}</StageChip>
                  </div>
                  <h3 className="mt-3 text-base font-semibold text-slate-950">
                    {match.lenderName}
                  </h3>
                  <p className="mt-1 text-sm text-slate-600">
                    {match.program} | {match.deal.name}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    {match.deal.borrower.name} | updated {shortDateTime(match.updatedAt)}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-3">
                    <SecondaryLink href={`/deals/${match.deal.id}/summary`}>
                      Open summary
                    </SecondaryLink>
                    <SecondaryLink href="/capital-sources">
                      Open capital sources
                    </SecondaryLink>
                  </div>
                </article>
              ))
            )}
          </div>
        </Panel>
      </div>
    </AppFrame>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-[20px] border border-dashed border-slate-200 bg-slate-50/60 px-4 py-6 text-sm text-slate-500">
      {message}
    </div>
  );
}

function InfoTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[18px] border border-slate-200 bg-white px-4 py-3">
      <p className="text-xs uppercase tracking-[0.16em] text-slate-500">{label}</p>
      <p className="mt-2 font-medium text-slate-900">{value}</p>
    </div>
  );
}
