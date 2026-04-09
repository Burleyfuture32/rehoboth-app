import { CapitalSourceStatus, DocumentStatus, SubmissionStatus, TaskStatus } from "@prisma/client";
import { getPrisma } from "./prisma";

export async function getBulkActionsData() {
  const prisma = getPrisma();
  const now = new Date();
  const threeDaysFromNow = new Date(now);
  threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

  const [deals, tasks, lenderFollowUps] = await Promise.all([
    prisma.deal.findMany({
      include: {
        borrower: true,
        loanFile: {
          select: {
            submissionStatus: true,
            recommendedAction: true,
          },
        },
        tasks: {
          where: {
            status: TaskStatus.OPEN,
          },
          orderBy: {
            dueDate: "asc",
          },
        },
        documentRequests: {
          where: {
            status: DocumentStatus.REQUESTED,
          },
          orderBy: {
            createdAt: "asc",
          },
        },
        capitalSources: {
          where: {
            status: {
              in: [CapitalSourceStatus.TARGETED, CapitalSourceStatus.SUBMITTED],
            },
          },
          orderBy: {
            updatedAt: "asc",
          },
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
    }),
    prisma.task.findMany({
      where: {
        status: TaskStatus.OPEN,
        dueDate: {
          lte: threeDaysFromNow,
        },
      },
      include: {
        deal: {
          include: {
            borrower: true,
          },
        },
      },
      orderBy: {
        dueDate: "asc",
      },
      take: 16,
    }),
    prisma.capitalSourceMatch.findMany({
      where: {
        status: {
          in: [CapitalSourceStatus.TARGETED, CapitalSourceStatus.SUBMITTED],
        },
      },
      include: {
        deal: {
          include: {
            borrower: true,
            loanFile: {
              select: {
                submissionStatus: true,
              },
            },
          },
        },
      },
      orderBy: {
        updatedAt: "asc",
      },
      take: 12,
    }),
  ]);

  const documentQueues = deals
    .filter((deal) => deal.documentRequests.length > 0)
    .map((deal) => ({
      id: deal.id,
      name: deal.name,
      borrowerName: deal.borrower.name,
      stage: deal.stage,
      requestedCount: deal.documentRequests.length,
      oldestRequestDate: deal.documentRequests[0]?.createdAt ?? now,
      nextDocumentTitle: deal.documentRequests[0]?.title ?? "Missing document",
    }))
    .sort((left, right) => right.requestedCount - left.requestedCount)
    .slice(0, 10);

  const submissionReadyDeals = deals
    .filter(
      (deal) =>
        deal.loanFile?.submissionStatus === SubmissionStatus.READY_TO_SUBMIT ||
        (deal.documentRequests.length === 0 &&
          deal.tasks.length <= 1 &&
          deal.capitalSources.length > 0 &&
          deal.loanFile?.submissionStatus !== SubmissionStatus.SUBMITTED),
    )
    .map((deal) => ({
      id: deal.id,
      name: deal.name,
      borrowerName: deal.borrower.name,
      stage: deal.stage,
      openTasks: deal.tasks.length,
      capitalSources: deal.capitalSources.length,
      recommendedAction:
        deal.loanFile?.recommendedAction ?? "Review lender handoff and submit",
      submissionStatus:
        deal.loanFile?.submissionStatus ?? SubmissionStatus.NOT_READY,
    }))
    .slice(0, 8);

  return {
    metrics: {
      dealsWithQueues: documentQueues.length,
      dueTasks: tasks.length,
      readyDeals: submissionReadyDeals.length,
      lenderFollowUps: lenderFollowUps.length,
    },
    documentQueues,
    dueTasks: tasks,
    submissionReadyDeals,
    lenderFollowUps,
  };
}
