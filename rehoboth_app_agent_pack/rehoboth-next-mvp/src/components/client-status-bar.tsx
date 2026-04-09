import {
  CapitalSourceStatus,
  DealStage,
  DocumentStatus,
  SubmissionStatus,
  TaskStatus,
} from "@prisma/client";
import { pipelineStageOrder } from "@/lib/pipeline";

type ClientStatusDeal = {
  stage: DealStage;
  loanFile?: {
    recommendedAction?: string | null;
    submissionStatus?: SubmissionStatus | null;
  } | null;
  tasks?: Array<{
    status: TaskStatus;
    title: string;
  }>;
  documentRequests?: Array<{
    status: DocumentStatus;
    title: string;
  }>;
  capitalSources?: Array<{
    status: CapitalSourceStatus;
  }>;
};

export function ClientStatusBar({
  deal,
  className,
}: {
  deal: ClientStatusDeal;
  className?: string;
}) {
  const stageIndex = pipelineStageOrder.indexOf(deal.stage);
  const completedStages = stageIndex >= 0 ? stageIndex + 1 : 1;
  const progressPercent = Math.max(
    16,
    Math.round((completedStages / pipelineStageOrder.length) * 100),
  );
  const nextStep = getNextStep(deal);

  return (
    <section
      className={`mb-6 rounded-[28px] border border-[color:var(--border-soft)] bg-[color:var(--surface)] p-5 backdrop-blur ${className ?? ""}`}
      style={{ boxShadow: "var(--panel-shadow)" }}
    >
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            Client status
          </p>
          <p className="mt-2 text-lg font-semibold text-slate-950">
            {formatStage(deal.stage)}
          </p>
          <p className="mt-1 text-sm text-slate-600">
            {completedStages} of {pipelineStageOrder.length} stages complete
          </p>
        </div>
        <p className="max-w-2xl text-sm font-medium text-slate-700">
          {nextStep}
        </p>
      </div>

      <div className="relative mt-4 overflow-hidden rounded-full border border-slate-200 bg-slate-100">
        <div
          aria-hidden="true"
          className="absolute inset-y-0 left-0 rounded-full bg-[linear-gradient(90deg,var(--brand-green)_0%,#7acb6e_100%)]"
          style={{ width: `${progressPercent}%` }}
        />
        <div className="relative flex min-h-14 items-center justify-between gap-3 px-5 py-3 text-sm">
          <span className="font-semibold text-slate-950">{progressPercent}% complete</span>
          <span className="truncate text-right text-slate-700">{nextStep}</span>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {pipelineStageOrder.map((stage, index) => {
          const isComplete = index <= stageIndex;
          const isCurrent = stage === deal.stage;

          return (
            <span
              key={stage}
              className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] ${
                isCurrent
                  ? "bg-[var(--brand-green)] text-white"
                  : isComplete
                    ? "bg-emerald-50 text-emerald-800"
                    : "bg-slate-100 text-slate-500"
              }`}
            >
              {formatStage(stage)}
            </span>
          );
        })}
      </div>
    </section>
  );
}

function getNextStep(deal: ClientStatusDeal) {
  const requestedDocument = deal.documentRequests?.find(
    (document) => document.status === DocumentStatus.REQUESTED,
  );

  if (requestedDocument) {
    return `Next step: collect ${requestedDocument.title}`;
  }

  const openTask = deal.tasks?.find((task) => task.status === TaskStatus.OPEN);

  if (openTask) {
    return `Next step: ${openTask.title}`;
  }

  if (deal.loanFile?.recommendedAction) {
    return `Next step: ${deal.loanFile.recommendedAction}`;
  }

  const hasLenderMotion = deal.capitalSources?.some(
    (source) =>
      source.status === CapitalSourceStatus.SUBMITTED ||
      source.status === CapitalSourceStatus.QUOTE_RECEIVED,
  );

  if (
    hasLenderMotion ||
    deal.loanFile?.submissionStatus === SubmissionStatus.SUBMITTED
  ) {
    return "Next step: review lender responses and prepare closing path";
  }

  const stageIndex = pipelineStageOrder.indexOf(deal.stage);
  const nextStage = pipelineStageOrder[stageIndex + 1];

  if (nextStage) {
    return `Next step: move file into ${formatStage(nextStage)}`;
  }

  return "Next step: confirm funding and post-close follow-up";
}

function formatStage(stage: DealStage) {
  return stage.replaceAll("_", " ");
}
