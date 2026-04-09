import { SubmissionStatus, type StatusTrackerSectionKey } from "@prisma/client";
import {
  getStatusTrackerProgressSummary,
  statusTrackerSectionOrder,
} from "@/lib/status-tracker";
import { getPrisma } from "./prisma";

export async function getPortalIndexData() {
  const prisma = getPrisma();
  const deals = await prisma.deal.findMany({
    include: {
      borrower: true,
      loanFile: true,
      documentRequests: {
        select: {
          status: true,
        },
      },
      statusTrackerSections: true,
    },
    orderBy: [{ targetCloseDate: "asc" }, { createdAt: "desc" }],
  });

  const decoratedDeals = deals.map((deal) => {
    const requestedDocuments = deal.documentRequests.filter(
      (document) => document.status === "REQUESTED",
    ).length;
    const uploadedDocuments = deal.documentRequests.filter(
      (document) => document.status === "UPLOADED",
    ).length;
    const trackerSummary = getStatusTrackerProgressSummary(deal.statusTrackerSections);

    return {
      ...deal,
      requestedDocuments,
      uploadedDocuments,
      trackerSummary,
      portalNextStep: getPortalNextStep({
        requestedDocuments,
        loanFile: deal.loanFile,
        stage: deal.stage,
      }),
    };
  });

  return {
    deals: decoratedDeals,
    metrics: {
      totalDeals: decoratedDeals.length,
      closingSoonCount: decoratedDeals.filter((deal) => daysUntil(deal.targetCloseDate) <= 14)
        .length,
      totalRequestedDocuments: decoratedDeals.reduce(
        (sum, deal) => sum + deal.requestedDocuments,
        0,
      ),
      totalUploadedDocuments: decoratedDeals.reduce(
        (sum, deal) => sum + deal.uploadedDocuments,
        0,
      ),
      totalVolume: decoratedDeals.reduce((sum, deal) => sum + deal.loanAmount, 0),
    },
  };
}

export async function getPortalDealData(dealId: string) {
  const prisma = getPrisma();
  const deal = await prisma.deal.findUnique({
    where: {
      id: dealId,
    },
    include: {
      borrower: true,
      loanFile: true,
      activities: {
        orderBy: {
          createdAt: "desc",
        },
        take: 8,
      },
      communicationLogs: {
        orderBy: {
          createdAt: "desc",
        },
        take: 4,
      },
      capitalSources: {
        orderBy: [{ status: "asc" }, { updatedAt: "desc" }],
      },
      documentRequests: {
        orderBy: [{ status: "asc" }, { createdAt: "asc" }],
      },
      tasks: {
        orderBy: [{ status: "asc" }, { dueDate: "asc" }],
      },
      statusTrackerSections: true,
    },
  });

  if (!deal) {
    return null;
  }

  const sections = [...deal.statusTrackerSections].sort(
    (left, right) =>
      statusTrackerSectionOrder.indexOf(left.sectionKey) -
      statusTrackerSectionOrder.indexOf(right.sectionKey),
  );
  const requestedDocuments = deal.documentRequests.filter(
    (document) => document.status === "REQUESTED",
  );
  const uploadedDocuments = deal.documentRequests.filter(
    (document) => document.status === "UPLOADED",
  );

  return {
    deal,
    sections,
    requestedDocuments,
    uploadedDocuments,
    trackerSummary: getStatusTrackerProgressSummary(sections),
    portalNextStep: getPortalNextStep({
      requestedDocuments: requestedDocuments.length,
      loanFile: deal.loanFile,
      stage: deal.stage,
    }),
    contacts: sections
      .filter((section) =>
        ["LO", "TITLE", "CLOSING"].includes(section.sectionKey),
      )
      .map((section) => ({
        role: getContactRole(section.sectionKey),
        owner: section.assignedToName ?? "Unassigned",
        company: section.personOrCompanyName,
        status: section.status,
      })),
  };
}

function getPortalNextStep({
  requestedDocuments,
  loanFile,
  stage,
}: {
  requestedDocuments: number;
  loanFile:
    | {
        recommendedAction: string | null;
        submissionStatus: SubmissionStatus;
      }
    | null
    | undefined;
  stage: string;
}) {
  if (requestedDocuments > 0) {
    return "Upload the remaining requested documents so the file can keep moving.";
  }

  if (loanFile?.recommendedAction) {
    return loanFile.recommendedAction;
  }

  if (loanFile?.submissionStatus === SubmissionStatus.SUBMITTED) {
    return "Your file is with capital partners now. Rehoboth will update you when lender feedback lands.";
  }

  if (stage === "CLOSING") {
    return "Closing coordination is active. Watch for final scheduling and funding updates.";
  }

  return "The Rehoboth team is actively reviewing your file and will post the next milestone here.";
}

function getContactRole(sectionKey: StatusTrackerSectionKey) {
  switch (sectionKey) {
    case "LO":
      return "Loan team";
    case "TITLE":
      return "Title coordination";
    case "CLOSING":
      return "Closing desk";
    default:
      return sectionKey.replaceAll("_", " ");
  }
}

function daysUntil(date: Date) {
  const millisecondsPerDay = 24 * 60 * 60 * 1000;
  return Math.ceil((date.getTime() - Date.now()) / millisecondsPerDay);
}
