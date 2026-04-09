import {
  CapitalSourceStatus,
  DocumentStatus,
  SubmissionStatus,
  TaskStatus,
} from "@prisma/client";
import { getPrisma } from "./prisma";

export async function getDealSummaryData(dealId: string) {
  const prisma = getPrisma();

  const deal = await prisma.deal.findUnique({
    where: {
      id: dealId,
    },
    include: {
      borrower: true,
      loanFile: true,
      documentRequests: {
        orderBy: [{ status: "asc" }, { createdAt: "asc" }],
      },
      tasks: {
        orderBy: [{ status: "asc" }, { dueDate: "asc" }],
      },
      activities: {
        orderBy: {
          createdAt: "desc",
        },
      },
      capitalSources: {
        orderBy: [{ status: "asc" }, { updatedAt: "desc" }],
      },
    },
  });

  if (!deal) {
    return null;
  }

  const requestedDocuments = deal.documentRequests.filter(
    (document) => document.status === DocumentStatus.REQUESTED,
  );
  const openTasks = deal.tasks.filter((task) => task.status === TaskStatus.OPEN);
  const manualMissingItems = (deal.loanFile?.missingItemsSummary ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  const hasSubmittedCapital = deal.capitalSources.some(
    (source) =>
      source.status === CapitalSourceStatus.SUBMITTED ||
      source.status === CapitalSourceStatus.QUOTE_RECEIVED,
  );
  const recommendedStatus = getRecommendedSubmissionStatus({
    openTaskCount: openTasks.length,
    requestedDocumentCount: requestedDocuments.length,
    capitalSourceCount: deal.capitalSources.length,
    hasSubmittedCapital,
  });
  const readinessSignals = getReadinessSignals({
    openTaskCount: openTasks.length,
    requestedDocumentCount: requestedDocuments.length,
    capitalSourceCount: deal.capitalSources.length,
    hasSubmittedCapital,
  });

  return {
    deal,
    requestedDocuments,
    openTasks,
    readinessSignals,
    recommendedStatus,
    missingItems: [
      ...manualMissingItems,
      ...requestedDocuments.map((document) => document.title),
      ...openTasks.map((task) => task.title),
    ],
  };
}

function getRecommendedSubmissionStatus({
  openTaskCount,
  requestedDocumentCount,
  capitalSourceCount,
  hasSubmittedCapital,
}: {
  openTaskCount: number;
  requestedDocumentCount: number;
  capitalSourceCount: number;
  hasSubmittedCapital: boolean;
}) {
  if (hasSubmittedCapital) {
    return SubmissionStatus.SUBMITTED;
  }

  if (
    requestedDocumentCount === 0 &&
    openTaskCount <= 1 &&
    capitalSourceCount > 0
  ) {
    return SubmissionStatus.READY_TO_SUBMIT;
  }

  return SubmissionStatus.NOT_READY;
}

function getReadinessSignals({
  openTaskCount,
  requestedDocumentCount,
  capitalSourceCount,
  hasSubmittedCapital,
}: {
  openTaskCount: number;
  requestedDocumentCount: number;
  capitalSourceCount: number;
  hasSubmittedCapital: boolean;
}) {
  return [
    {
      label: "Requested documents",
      value: requestedDocumentCount === 0 ? "Clear" : `${requestedDocumentCount} still open`,
      state: requestedDocumentCount === 0 ? "good" : "warn",
    },
    {
      label: "Open tasks",
      value: openTaskCount <= 1 ? "Controlled" : `${openTaskCount} still open`,
      state: openTaskCount <= 1 ? "good" : "warn",
    },
    {
      label: "Capital sources",
      value:
        capitalSourceCount > 0
          ? `${capitalSourceCount} tracked`
          : "No lenders tracked yet",
      state: capitalSourceCount > 0 ? "good" : "warn",
    },
    {
      label: "Submission motion",
      value: hasSubmittedCapital ? "Already out with lenders" : "Not yet submitted",
      state: hasSubmittedCapital ? "good" : "neutral",
    },
  ] as const;
}
