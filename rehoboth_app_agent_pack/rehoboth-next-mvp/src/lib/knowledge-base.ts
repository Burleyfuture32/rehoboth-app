import { TaskStatus } from "@prisma/client";
import { getStatusTrackerProgressSummary } from "@/lib/status-tracker";
import { getPrisma } from "./prisma";

export type KnowledgeRouteHint = {
  href: string;
  label: string;
};

export type KnowledgeResourceKey =
  | "ratesheets"
  | "capital-sources"
  | "documents"
  | "submission-summary"
  | "status-tracker"
  | "task-center"
  | "workflows";

export type KnowledgeAssistantReply = {
  answer: string;
  routeHints?: KnowledgeRouteHint[];
};

export type KnowledgeDealContext = {
  id: string;
  name: string;
  borrowerName: string;
  stage: string;
  dealType: string;
  market: string;
  program: string;
  openTasksCount: number;
  requestedDocumentsCount: number;
  capitalSourcesCount: number;
  trackerPercent: number;
  submissionStatus: string;
  knowledgeEntriesCount: number;
};

export type KnowledgeHistoryEntry = {
  id: string;
  question: string;
  answer: string;
  resourceKey: KnowledgeResourceKey | null;
  createdBy: string;
  createdAt: string;
};

export const knowledgeBaseLoanPlaybooks = [
  {
    title: "DSCR Rental Purchase",
    summary:
      "Use this when the borrower is buying a rental and the file needs rent support, value support, and a fast lender fit check.",
    checkpoints: [
      "Borrower entity and vesting are clean",
      "Purchase contract and rehab scope match loan ask",
      "Rent support, market strength, and reserves are documented",
    ],
    bestResource: "Ratesheets plus submission summary",
    href: "/ratesheets",
    linkLabel: "Open ratesheets",
  },
  {
    title: "DSCR Cash-Out Refinance",
    summary:
      "Best for seasoning-sensitive files where value, payoff, and cash-out purpose need to stay clean before lender submission.",
    checkpoints: [
      "Payoff and existing lien details are verified",
      "Current rents, leases, and trailing performance are organized",
      "Cash-out purpose is explained in the file notes",
    ],
    bestResource: "Documents and capital sources",
    href: "/documents",
    linkLabel: "Open documents",
  },
  {
    title: "Bridge / Fix-and-Flip",
    summary:
      "This scenario works when speed matters, renovation scope matters, and lender appetite changes deal to deal.",
    checkpoints: [
      "Scope, budget, and exit strategy are aligned",
      "As-is and after-repair value logic is documented",
      "Timeline pressure is visible in tasks and status tracker",
    ],
    bestResource: "Capital sources and workflows",
    href: "/capital-sources",
    linkLabel: "Open capital sources",
  },
  {
    title: "Stabilized Multifamily / CRE Refinance",
    summary:
      "Use this for larger stabilized assets where NOI, DSCR, rent roll quality, and sponsor story drive lender fit.",
    checkpoints: [
      "Rent roll and trailing financials reconcile",
      "NOI and DSCR story are consistent across docs",
      "Quotes are compared before final submission motion",
    ],
    bestResource: "Ratesheets and reports",
    href: "/reports",
    linkLabel: "Open reports",
  },
  {
    title: "Rush Closing Scenario",
    summary:
      "Use this when a file is viable but the schedule is compressed and every owner needs obvious next moves.",
    checkpoints: [
      "Critical missing docs are narrowed to only must-have items",
      "Title, lender, and closing owners have explicit due dates",
      "Blockers are visible on the status tracker and summary",
    ],
    bestResource: "Status tracker and task center",
    href: "/tasks",
    linkLabel: "Open task center",
  },
] as const;

export const knowledgeBaseScenarioGuides = [
  {
    title: "Borrower missing documents",
    whenToUse:
      "Use this when the file is real but still waiting on financials, entity docs, leases, insurance, or title items.",
    nextMoves: [
      "Narrow the list to the actual decision-blocking documents",
      "Post the ask in documents and the submission summary",
      "Keep one owner accountable in the status tracker",
    ],
  },
  {
    title: "Appraisal or value pressure",
    whenToUse:
      "Use this when proceeds, leverage, or the lender fit changes because value support is weaker than expected.",
    nextMoves: [
      "Restate leverage and proceeds expectations",
      "Compare whether another lender profile fits better",
      "Update capital-source notes before resubmitting",
    ],
  },
  {
    title: "Title or closing delay",
    whenToUse:
      "Use this when the deal is mostly ready but title work, payoff, insurance, or attorney coordination is slowing funding.",
    nextMoves: [
      "Move the delay into the status tracker as a visible blocker",
      "Assign one owner and one due date for the next update",
      "Keep the client-facing portal note plain and current",
    ],
  },
  {
    title: "Low DSCR or weak cash flow story",
    whenToUse:
      "Use this when the file is not dead but the lender story needs stronger reserves, better narrative, or a different program fit.",
    nextMoves: [
      "Tighten the borrower and property story in the file",
      "Check which lenders tolerate the profile better",
      "Use submission notes instead of hiding the weakness",
    ],
  },
  {
    title: "Need lender comparison fast",
    whenToUse:
      "Use this when the deal is ready enough to price but you need a short list instead of a broad lender search.",
    nextMoves: [
      "Use ratesheets to narrow the field",
      "Track only real candidates in capital sources",
      "Push the final decision into submission summary notes",
    ],
  },
] as const;

export const knowledgeBaseResources = [
  {
    key: "ratesheets" as const,
    title: "Ratesheets",
    detail:
      "Best for lender appetite, leverage, pricing ranges, and who should see the file first.",
    href: "/ratesheets",
    linkLabel: "Open ratesheets",
  },
  {
    key: "capital-sources" as const,
    title: "Capital Sources",
    detail:
      "Best for live lender motion on an active file: targeted, submitted, quoted, or passed.",
    href: "/capital-sources",
    linkLabel: "Open capital sources",
  },
  {
    key: "submission-summary" as const,
    title: "Submission Summary",
    detail:
      "Best for deciding whether the file is not ready, ready to submit, or already out with lenders.",
    href: "/pipeline",
    linkLabel: "Start from pipeline",
  },
  {
    key: "documents" as const,
    title: "Documents",
    detail:
      "Best for requested items, uploads, and the exact file pressure blocking next steps.",
    href: "/documents",
    linkLabel: "Open documents",
  },
  {
    key: "status-tracker" as const,
    title: "Status Tracker",
    detail:
      "Best for owner-by-owner checkpoints, blockers, due dates, and what is actually stuck on the file.",
    href: "/pipeline",
    linkLabel: "Start from pipeline",
  },
  {
    key: "workflows" as const,
    title: "Workflows",
    detail:
      "Best for repeatable operating motions when you want to spin up the right tasks and document asks quickly.",
    href: "/workflows",
    linkLabel: "Open workflows",
  },
  {
    key: "task-center" as const,
    title: "Task Center",
    detail:
      "Best for the immediate next moves across active files when leadership asks what still has to happen.",
    href: "/tasks",
    linkLabel: "Open task center",
  },
] as const;

const defaultReply: KnowledgeAssistantReply = {
  answer:
    "Ask me about a loan type, scenario, blocker, lender-fit question, or which Rehoboth screen or resource should be used next. I can help with DSCR, bridge, refinance, closing pressure, missing docs, lender comparison, and submission readiness.",
  routeHints: [
    { href: "/ratesheets", label: "Ratesheets" },
    { href: "/capital-sources", label: "Capital Sources" },
    { href: "/documents", label: "Documents" },
  ],
};

const knowledgeBaseReplies: Array<{
  match: string[];
  reply: KnowledgeAssistantReply;
}> = [
  {
    match: ["dscr", "rental", "investor purchase"],
    reply: {
      answer:
        "For DSCR files, keep rent support, reserves, entity docs, and leverage expectations clean first. Start with ratesheets for lender fit, keep missing items in documents, and use submission summary to decide when the file is actually ready to go out.",
      routeHints: [
        { href: "/ratesheets", label: "Open ratesheets" },
        { href: "/documents", label: "Open documents" },
      ],
    },
  },
  {
    match: ["bridge", "fix and flip", "rehab", "flip"],
    reply: {
      answer:
        "Bridge and fix-and-flip files usually turn on scope, budget, exit strategy, and speed. Use capital sources for active lender motion, keep timeline pressure visible in tasks, and log blockers in the status tracker on the file.",
      routeHints: [
        { href: "/capital-sources", label: "Open capital sources" },
        { href: "/tasks", label: "Open task center" },
      ],
    },
  },
  {
    match: ["cash out", "refinance", "refi"],
    reply: {
      answer:
        "Cash-out refinance files need a clean payoff story, current performance support, and a clear purpose for proceeds. Organize the documents first, then compare lenders that fit the leverage and seasoning profile before marking the file ready to submit.",
      routeHints: [
        { href: "/documents", label: "Open documents" },
        { href: "/ratesheets", label: "Open ratesheets" },
      ],
    },
  },
  {
    match: ["missing docs", "documents", "document", "upload"],
    reply: {
      answer:
        "When documents are missing, narrow the list to what actually blocks credit or closing. Request only those items, keep the rest in notes, and reflect the pressure in submission summary and task ownership so the file does not look stalled without context.",
      routeHints: [
        { href: "/documents", label: "Open documents" },
        { href: "/tasks", label: "Open task center" },
      ],
    },
  },
  {
    match: ["lender", "quote", "pricing", "compare", "ratesheet"],
    reply: {
      answer:
        "Use ratesheets to narrow the field, then track only realistic live candidates in capital sources. The rule is simple: compare in ratesheets, execute in capital sources, and document the final logic in submission summary.",
      routeHints: [
        { href: "/ratesheets", label: "Open ratesheets" },
        { href: "/capital-sources", label: "Open capital sources" },
      ],
    },
  },
  {
    match: ["submission", "ready", "submit", "handoff"],
    reply: {
      answer:
        "Submission readiness should come from three things together: document pressure, task pressure, and lender motion. Use the summary page to combine those into one answer instead of guessing from a single screen.",
      routeHints: [
        { href: "/pipeline", label: "Open a deal from pipeline" },
        { href: "/reports", label: "Open reports" },
      ],
    },
  },
  {
    match: ["title", "closing", "attorney", "delay", "funding"],
    reply: {
      answer:
        "For title and closing issues, make the blocker explicit, assign one owner, and give it a real due date. The file should show the problem in the tracker rather than hiding it in a note, especially when the timeline is tight.",
      routeHints: [
        { href: "/tasks", label: "Open task center" },
        { href: "/pipeline", label: "Start from pipeline" },
      ],
    },
  },
  {
    match: ["workflow", "template", "automation"],
    reply: {
      answer:
        "Use workflows when the same file pattern repeats and you want the right tasks and document requests created fast. It is not a rule engine yet; it is a fast launcher for the most common operating motions.",
      routeHints: [{ href: "/workflows", label: "Open workflows" }],
    },
  },
];

export const knowledgeBaseSuggestedQuestions = [
  "How should I work a DSCR rental file?",
  "What do I do when docs are still missing?",
  "Where should I compare lender options?",
  "How do I handle a rush closing scenario?",
  "What makes a file ready to submit?",
];

export async function getKnowledgeBasePageData(dealId?: string) {
  const prisma = getPrisma();

  const [deals, ratesheetCount, capitalMatchCount] = await Promise.all([
    prisma.deal.findMany({
      include: {
        borrower: true,
        loanFile: true,
        tasks: {
          where: {
            status: TaskStatus.OPEN,
          },
          select: {
            id: true,
          },
        },
        documentRequests: {
          select: {
            status: true,
          },
        },
        capitalSources: {
          select: {
            id: true,
          },
        },
        knowledgeEntries: {
          select: {
            id: true,
          },
        },
        statusTrackerSections: true,
      },
      orderBy: [{ targetCloseDate: "asc" }, { createdAt: "desc" }],
    }),
    prisma.lenderRatesheet.count(),
    prisma.capitalSourceMatch.count(),
  ]);

  const dealOptions = deals.map((deal) => ({
    id: deal.id,
    name: deal.name,
    borrowerName: deal.borrower.name,
  }));

  const selectedDealRecord = dealId
    ? deals.find((deal) => deal.id === dealId) ?? null
    : null;

  const selectedDeal = selectedDealRecord
    ? {
        id: selectedDealRecord.id,
        name: selectedDealRecord.name,
        borrowerName: selectedDealRecord.borrower.name,
        stage: selectedDealRecord.stage.replaceAll("_", " "),
        dealType: selectedDealRecord.dealType,
        market: selectedDealRecord.market,
        program: selectedDealRecord.program,
        openTasksCount: selectedDealRecord.tasks.length,
        requestedDocumentsCount: selectedDealRecord.documentRequests.filter(
          (document) => document.status === "REQUESTED",
        ).length,
        capitalSourcesCount: selectedDealRecord.capitalSources.length,
        trackerPercent: getStatusTrackerProgressSummary(
          selectedDealRecord.statusTrackerSections,
        ).overallPercent,
        submissionStatus:
          selectedDealRecord.loanFile?.submissionStatus.replaceAll("_", " ") ??
          "NOT READY",
        knowledgeEntriesCount: selectedDealRecord.knowledgeEntries.length,
      }
    : null;

  const knowledgeHistory = selectedDealRecord
    ? (
        await prisma.dealKnowledgeEntry.findMany({
          where: {
            dealId: selectedDealRecord.id,
          },
          orderBy: {
            createdAt: "desc",
          },
          take: 10,
        })
      ).map((entry) => ({
        id: entry.id,
        question: entry.question,
        answer: entry.answer,
        resourceKey: (entry.resourceKey as KnowledgeResourceKey | null) ?? null,
        createdBy: entry.createdBy,
        createdAt: entry.createdAt.toISOString(),
      }))
    : [];

  return {
    counts: {
      liveDeals: deals.length,
      ratesheets: ratesheetCount,
      capitalMatches: capitalMatchCount,
      resources: knowledgeBaseResources.length,
    },
    dealOptions,
    selectedDeal,
    knowledgeHistory,
  };
}

export function getKnowledgeAssistantReply(
  question: string,
  context?: {
    selectedDeal?: KnowledgeDealContext | null;
    selectedResource?: KnowledgeResourceKey;
  },
): KnowledgeAssistantReply {
  const normalized = question.trim().toLowerCase();
  const resource = knowledgeBaseResources.find(
    (item) => item.key === context?.selectedResource,
  );

  if (!normalized) {
    return withContext(defaultReply, context);
  }

  const matched = knowledgeBaseReplies.find((entry) =>
    entry.match.some((term) => normalized.includes(term)),
  );

  if (!matched && resource) {
    return withContext(
      {
        answer: `If your question is mainly about ${resource.title.toLowerCase()}, start in ${resource.title}. ${resource.detail}`,
        routeHints: [{ href: resource.href, label: resource.linkLabel }],
      },
      context,
    );
  }

  return withContext(matched?.reply ?? defaultReply, context);
}

function withContext(
  reply: KnowledgeAssistantReply,
  context?: {
    selectedDeal?: KnowledgeDealContext | null;
    selectedResource?: KnowledgeResourceKey;
  },
) {
  const selectedDeal = context?.selectedDeal;
  const resource = knowledgeBaseResources.find(
    (item) => item.key === context?.selectedResource,
  );

  if (!selectedDeal && !resource) {
    return reply;
  }

  const additions: string[] = [];

  if (selectedDeal) {
    additions.push(
      `Active file context: ${selectedDeal.borrowerName} | ${selectedDeal.name} | ${selectedDeal.stage} | ${selectedDeal.requestedDocumentsCount} requested docs | ${selectedDeal.openTasksCount} open tasks | ${selectedDeal.trackerPercent}% tracker progress.`,
    );
  }

  if (resource) {
    additions.push(`Current resource lane: ${resource.title}.`);
  }

  return {
    ...reply,
    answer: `${reply.answer} ${additions.join(" ")}`.trim(),
  };
}
