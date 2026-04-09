import {
  CapitalSourceStatus,
  DocumentStatus,
  SubmissionStatus,
  TaskStatus,
} from "@prisma/client";
import { getPrisma } from "./prisma";

const focusDefinitions = [
  {
    key: "documents",
    label: "Document pressure",
    terms: ["document", "documents", "docs", "upload", "uploads", "condition", "conditions"],
  },
  {
    key: "tasks",
    label: "Task pressure",
    terms: ["task", "tasks", "follow-up", "followup", "owner", "owners", "todo", "todos"],
  },
  {
    key: "submission",
    label: "Submission readiness",
    terms: ["submit", "submission", "ready", "readiness", "handoff", "underwriting"],
  },
  {
    key: "capital",
    label: "Capital source activity",
    terms: ["capital", "lender", "lenders", "source", "sources", "quote", "quotes", "pricing"],
  },
  {
    key: "clients",
    label: "Client relationship view",
    terms: ["client", "clients", "borrower", "borrowers", "contact", "contacts", "relationship"],
  },
  {
    key: "pipeline",
    label: "Pipeline stage view",
    terms: ["pipeline", "stage", "stages", "closing", "processing", "lead", "new file"],
  },
] as const;

const stopWords = new Set([
  "a",
  "an",
  "and",
  "are",
  "as",
  "at",
  "be",
  "for",
  "from",
  "give",
  "i",
  "in",
  "is",
  "me",
  "need",
  "of",
  "on",
  "or",
  "report",
  "show",
  "specific",
  "the",
  "they",
  "to",
  "us",
  "want",
  "what",
  "whatever",
  "with",
]);

type DealRecord = Awaited<ReturnType<typeof loadReportDeals>>[number];

export async function getReportsData(request?: string) {
  const deals = await loadReportDeals();

  const stageCounts = deals.reduce<Record<string, number>>((accumulator, deal) => {
    accumulator[deal.stage] = (accumulator[deal.stage] ?? 0) + 1;
    return accumulator;
  }, {});

  const submissionCounts = Object.values(SubmissionStatus).map((status) => ({
    status,
    count: deals.filter((deal) => deal.submissionStatus === status).length,
  }));

  const capitalCounts = Object.values(CapitalSourceStatus).map((status) => ({
    status,
    count: deals.flatMap((deal) => deal.capitalSources).filter((item) => item.status === status)
      .length,
  }));

  return {
    metrics: {
      totalDeals: deals.length,
      totalVolume: deals.reduce((sum, deal) => sum + deal.loanAmount, 0),
      openTasks: deals.reduce((sum, deal) => sum + deal.openTasks, 0),
      requestedDocuments: deals.reduce((sum, deal) => sum + deal.requestedDocuments, 0),
      activeCapitalSources: deals.reduce((sum, deal) => sum + deal.capitalSources.length, 0),
    },
    stageCounts: Object.entries(stageCounts),
    submissionCounts,
    capitalCounts,
    dealRows: deals.map((deal) => ({
      id: deal.id,
      name: deal.name,
      borrowerName: deal.borrowerName,
      stage: deal.stage,
      submissionStatus: deal.submissionStatus,
      openTasks: deal.openTasks,
      requestedDocuments: deal.requestedDocuments,
      capitalSources: deal.capitalSources.length,
      loanAmount: deal.loanAmount,
    })),
    customReport: buildCustomReport(request, deals),
  };
}

async function loadReportDeals() {
  const prisma = getPrisma();
  const deals = await prisma.deal.findMany({
    include: {
      borrower: true,
      loanFile: true,
      tasks: true,
      documentRequests: true,
      capitalSources: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return deals.map((deal) => ({
    id: deal.id,
    name: deal.name,
    borrowerName: deal.borrower.name,
    borrowerEmail: deal.borrower.email,
    borrowerPhone: deal.borrower.phone,
    entityType: deal.borrower.entityType,
    dealType: deal.dealType,
    stage: deal.stage,
    program: deal.program,
    market: deal.market,
    source: deal.source,
    propertyAddress: deal.propertyAddress,
    targetCloseDate: deal.targetCloseDate,
    loanAmount: deal.loanAmount,
    submissionStatus: deal.loanFile?.submissionStatus ?? SubmissionStatus.NOT_READY,
    openTasks: deal.tasks.filter((task) => task.status === TaskStatus.OPEN).length,
    requestedDocuments: deal.documentRequests.filter(
      (document) => document.status === DocumentStatus.REQUESTED,
    ).length,
    capitalSources: deal.capitalSources,
  }));
}

function buildCustomReport(rawRequest: string | undefined, deals: DealRecord[]) {
  const request = rawRequest?.trim() ?? "";
  if (!request) {
    return null;
  }

  const normalizedRequest = normalize(request);
  const activeFocuses = focusDefinitions.filter((definition) =>
    definition.terms.some((term) => normalizedRequest.includes(term)),
  );
  const focusLabels =
    activeFocuses.length > 0
      ? activeFocuses.map((definition) => definition.label)
      : ["General portfolio view"];

  const filters = {
    residential: normalizedRequest.includes("residential"),
    cre:
      normalizedRequest.includes(" cre ") ||
      normalizedRequest.startsWith("cre ") ||
      normalizedRequest.endsWith(" cre") ||
      normalizedRequest.includes("commercial"),
    ready:
      normalizedRequest.includes("ready") ||
      normalizedRequest.includes("submission"),
    closing: normalizedRequest.includes("closing"),
  };

  const searchTerms = normalizedRequest
    .split(/[^a-z0-9]+/)
    .filter((term) => term.length >= 3 && !stopWords.has(term));

  const matchedDeals = deals
    .filter((deal) => {
      if (filters.residential && deal.dealType !== "RESIDENTIAL") {
        return false;
      }
      if (filters.cre && deal.dealType !== "CRE") {
        return false;
      }
      if (filters.ready && deal.submissionStatus === SubmissionStatus.NOT_READY) {
        return false;
      }
      if (filters.closing && deal.stage !== "CLOSING") {
        return false;
      }

      if (searchTerms.length === 0) {
        return true;
      }

      const haystack = normalize(
        [
          deal.name,
          deal.borrowerName,
          deal.borrowerEmail,
          deal.borrowerPhone,
          deal.entityType,
          deal.dealType,
          deal.stage,
          deal.program,
          deal.market,
          deal.source,
          deal.propertyAddress,
          deal.submissionStatus,
        ].join(" "),
      );

      return searchTerms.some((term) => haystack.includes(term));
    })
    .sort((left, right) => scoreDealForAttention(right) - scoreDealForAttention(left));

  const reportDeals = (matchedDeals.length > 0 ? matchedDeals : deals).slice(0, 6);
  const totalVolume = reportDeals.reduce((sum, deal) => sum + deal.loanAmount, 0);
  const openTasks = reportDeals.reduce((sum, deal) => sum + deal.openTasks, 0);
  const requestedDocuments = reportDeals.reduce(
    (sum, deal) => sum + deal.requestedDocuments,
    0,
  );
  const readyToSubmit = reportDeals.filter(
    (deal) => deal.submissionStatus !== SubmissionStatus.NOT_READY,
  ).length;
  const hottestFile = reportDeals[0];

  return {
    request,
    title: `Custom report for: ${request}`,
    description: `This report focuses on ${focusLabels.join(", ").toLowerCase()} across the files that best match the request.`,
    focusLabels,
    metrics: [
      {
        label: "Matched files",
        value: `${reportDeals.length}`,
        detail: matchedDeals.length > 0
          ? "Files directly matched to the request."
          : "No exact text match found, so this falls back to the live portfolio.",
      },
      {
        label: "Matched volume",
        value: currencyCompact(totalVolume),
        detail: "Requested loan amount tied to the files in this custom report.",
      },
      {
        label: "Open tasks",
        value: `${openTasks}`,
        detail: "Outstanding work still sitting on the matched files.",
      },
      {
        label: "Requested docs",
        value: `${requestedDocuments}`,
        detail: "Document pressure across the selected files.",
      },
      {
        label: "Submission-ready",
        value: `${readyToSubmit}`,
        detail: "Files that are beyond not-ready status for lender handoff.",
      },
    ],
    insights: [
      hottestFile
        ? `${hottestFile.name} is the hottest file in this view with ${hottestFile.openTasks} open task${hottestFile.openTasks === 1 ? "" : "s"} and ${hottestFile.requestedDocuments} pending document${hottestFile.requestedDocuments === 1 ? "" : "s"}.`
        : "No files are available in the current portfolio.",
      requestedDocuments > 0
        ? `${requestedDocuments} requested document${requestedDocuments === 1 ? "" : "s"} are still slowing the files in this report.`
        : "Document pressure is low in this slice right now.",
      readyToSubmit > 0
        ? `${readyToSubmit} file${readyToSubmit === 1 ? "" : "s"} in this view are already moving toward lender handoff.`
        : "None of the files in this slice are ready for lender handoff yet.",
    ],
    nextMoves: [
      openTasks > 0
        ? "Work the open task queue first so the selected files stop aging in place."
        : "Task pressure is low, so focus on borrower communication and lender positioning.",
      requestedDocuments > 0
        ? "Use the document center to clear the pending requests on the files in this report."
        : "Use capital-source outreach or submission prep to move the strongest files forward.",
      hottestFile
        ? `Open ${hottestFile.name} first if you want the quickest file-level follow-up.`
        : "Add more live files to make the custom report more useful.",
    ],
    deals: reportDeals,
  };
}

function scoreDealForAttention(deal: DealRecord) {
  return deal.openTasks * 3 + deal.requestedDocuments * 4 + deal.capitalSources.length;
}

function normalize(value: string) {
  return ` ${value.toLowerCase().replaceAll(/[_-]+/g, " ").replaceAll(/\s+/g, " ").trim()} `;
}

function currencyCompact(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}
