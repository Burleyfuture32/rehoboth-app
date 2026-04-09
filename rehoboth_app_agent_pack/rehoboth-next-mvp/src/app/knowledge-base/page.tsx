import { AppFrame } from "@/components/app-frame";
import { KnowledgeBaseAssistant } from "@/components/knowledge-base-assistant";
import {
  PageHeader,
  Panel,
  PrimaryLink,
  SecondaryLink,
  StageChip,
} from "@/components/ui";
import {
  knowledgeBaseLoanPlaybooks,
  getKnowledgeBasePageData,
  knowledgeBaseResources,
  knowledgeBaseScenarioGuides,
} from "@/lib/knowledge-base";

export default async function KnowledgeBasePage({
  searchParams,
}: {
  searchParams: Promise<{ dealId?: string }>;
}) {
  const params = await searchParams;
  const data = await getKnowledgeBasePageData(params.dealId);

  return (
    <AppFrame>
      <PageHeader
        eyebrow="Knowledge base"
        title="Loan playbooks, scenario guidance, and resource chat"
        description="This tab is the operating reference point for Rehoboth process questions. Use it for specific loan scenarios, practical next-step guidance, and direct chat that routes you to the right internal resource."
        actions={
          <>
            <PrimaryLink href="/pipeline">Open pipeline</PrimaryLink>
            <SecondaryLink href="/ratesheets">Open ratesheets</SecondaryLink>
            <SecondaryLink href="/documents">Open documents</SecondaryLink>
            <SecondaryLink href="/workflows">Open workflows</SecondaryLink>
          </>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <TopCard
          label="Live deals"
          value={`${data.counts.liveDeals}`}
          detail="Knowledge-base context can now anchor to active files."
        />
        <TopCard
          label="Ratesheets"
          value={`${data.counts.ratesheets}`}
          detail="Live lender resource count available to route questions."
        />
        <TopCard
          label="Capital matches"
          value={`${data.counts.capitalMatches}`}
          detail="Tracked live lender motions available as a resource lane."
        />
        <TopCard
          label="Resource lanes"
          value={`${data.counts.resources}`}
          detail="Dedicated chat paths for the tools Rehoboth already uses."
        />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[320px_minmax(0,1fr)]">
        <Panel
          title="Choose a live file"
          description="Load a specific loan so the chat and playbooks can answer with real file pressure in view."
        >
          <form className="grid gap-4" method="GET">
            <label className="grid gap-2 text-sm">
              <span className="font-medium text-slate-700">Deal</span>
              <select
                className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-emerald-400"
                defaultValue={data.selectedDeal?.id ?? ""}
                name="dealId"
              >
                <option value="">No deal context</option>
                {data.dealOptions.map((deal) => (
                  <option key={deal.id} value={deal.id}>
                    {deal.name} | {deal.borrowerName}
                  </option>
                ))}
              </select>
            </label>
            <button
              className="inline-flex items-center justify-center rounded-full bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-700"
              type="submit"
            >
              Load deal context
            </button>
          </form>
        </Panel>

        <Panel
          title="Live file context"
          description="This gives the knowledge base a specific loan frame before you ask process or scenario questions."
        >
          {data.selectedDeal ? (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <ContextCard label="Borrower" value={data.selectedDeal.borrowerName} />
              <ContextCard
                label="Stage"
                value={`${data.selectedDeal.stage} | ${data.selectedDeal.dealType}`}
              />
              <ContextCard
                label="File pressure"
                value={`${data.selectedDeal.requestedDocumentsCount} docs | ${data.selectedDeal.openTasksCount} tasks`}
              />
              <ContextCard
                label="Readiness"
                value={`${data.selectedDeal.submissionStatus} | ${data.selectedDeal.trackerPercent}% tracker`}
              />
              <ContextCard
                label="Knowledge history"
                value={`${data.selectedDeal.knowledgeEntriesCount} reusable Q&A notes`}
              />
            </div>
          ) : (
            <div className="rounded-[22px] border border-dashed border-slate-200 bg-slate-50/60 px-4 py-6 text-sm text-slate-500">
              No live file selected. The page still works for general scenarios, but
              selecting a deal makes the chat and guidance more specific.
            </div>
          )}
        </Panel>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(360px,0.85fr)]">
        <Panel
          title="Loan playbooks"
          description="Start here when the question is about a specific loan type or structure."
        >
          <div className="grid gap-4 xl:grid-cols-2">
            {knowledgeBaseLoanPlaybooks.map((playbook) => (
              <article
                key={playbook.title}
                className="rounded-[24px] border border-slate-200 bg-slate-50/70 p-5"
              >
                <StageChip>Loan Scenario</StageChip>
                <h2 className="mt-3 text-lg font-semibold text-slate-950">
                  {playbook.title}
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {playbook.summary}
                </p>
                <div className="mt-4 space-y-2">
                  {playbook.checkpoints.map((checkpoint) => (
                    <div
                      key={checkpoint}
                      className="rounded-[18px] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700"
                    >
                      {checkpoint}
                    </div>
                  ))}
                </div>
                <div className="mt-4 rounded-[18px] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                    Best resource
                  </p>
                  <p className="mt-2">{playbook.bestResource}</p>
                </div>
                <a
                  className="mt-4 inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-100"
                  href={playbook.href}
                >
                  {playbook.linkLabel}
                </a>
              </article>
            ))}
          </div>
        </Panel>

        <Panel
          title="Resource directory"
          description="Use this when you already know the kind of answer you need and just need the right lane."
        >
          <div className="space-y-3">
            {knowledgeBaseResources.map((resource) => (
              <div
                key={resource.title}
                className="rounded-[22px] border border-slate-200 bg-slate-50/70 p-4"
              >
                <p className="text-base font-semibold text-slate-950">
                  {resource.title}
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {resource.detail}
                </p>
                <a
                  className="mt-3 inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-100"
                  href={resource.href}
                >
                  {resource.linkLabel}
                </a>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <div className="mt-4">
        <Panel
          title="Scenario library"
          description="These are the operating situations that come up repeatedly in the Rehoboth process."
        >
          <div className="grid gap-4 xl:grid-cols-2">
            {knowledgeBaseScenarioGuides.map((scenario) => (
              <article
                key={scenario.title}
                className="rounded-[24px] border border-slate-200 bg-slate-50/70 p-5"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <StageChip>Scenario</StageChip>
                </div>
                <h2 className="mt-3 text-lg font-semibold text-slate-950">
                  {scenario.title}
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {scenario.whenToUse}
                </p>
                <div className="mt-4 space-y-2">
                  {scenario.nextMoves.map((move) => (
                    <div
                      key={move}
                      className="rounded-[18px] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700"
                    >
                      {move}
                    </div>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </Panel>
      </div>

      <div className="mt-4">
        <Panel
          title="Direct process chat"
          description="Ask anything related to the loan process, file blockers, or which resource should handle the next move."
        >
          <KnowledgeBaseAssistant
            initialKnowledgeHistory={data.knowledgeHistory}
            selectedDeal={data.selectedDeal}
          />
        </Panel>
      </div>
    </AppFrame>
  );
}

function TopCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-[24px] border border-slate-200 bg-slate-50/70 p-5 shadow-[0_18px_50px_rgba(16,24,18,0.08)]">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-slate-950">
        {value}
      </p>
      <p className="mt-2 text-sm leading-6 text-slate-500">{detail}</p>
    </div>
  );
}

function ContextCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[20px] border border-slate-200 bg-slate-50/70 p-4">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-2 text-sm font-semibold text-slate-950">{value}</p>
    </div>
  );
}
