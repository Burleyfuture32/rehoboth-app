import { DealStage, TaskStatus } from "@prisma/client";
import { getPrisma } from "./prisma";

export const pipelineStageOrder = [
  DealStage.LEAD,
  DealStage.NEW_FILE,
  DealStage.PROCESSING,
  DealStage.UNDERWRITING,
  DealStage.DOCS_REQUESTED,
  DealStage.CLOSING,
] as const;

export async function getPipelineData() {
  const prisma = getPrisma();

  const deals = await prisma.deal.findMany({
    include: {
      borrower: true,
      tasks: {
        where: {
          status: TaskStatus.OPEN,
        },
        orderBy: {
          dueDate: "asc",
        },
        take: 1,
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return pipelineStageOrder.map((stage) => ({
    stage,
    deals: deals.filter((deal) => deal.stage === stage),
  }));
}

export async function getTaskCenterData() {
  const prisma = getPrisma();

  const tasks = await prisma.task.findMany({
    include: {
      deal: {
        include: {
          borrower: true,
        },
      },
    },
    orderBy: [{ status: "asc" }, { dueDate: "asc" }],
  });

  return tasks;
}

export async function getDealWorkspaceData(dealId: string) {
  const prisma = getPrisma();

  return prisma.deal.findUnique({
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
        take: 4,
      },
      communicationLogs: {
        orderBy: {
          createdAt: "desc",
        },
        take: 4,
      },
      knowledgeEntries: {
        orderBy: {
          createdAt: "desc",
        },
        take: 3,
      },
      capitalSources: {
        orderBy: [{ status: "asc" }, { updatedAt: "desc" }],
        take: 3,
      },
      documentRequests: {
        orderBy: [{ status: "asc" }, { createdAt: "asc" }],
      },
      tasks: {
        orderBy: [{ status: "asc" }, { dueDate: "asc" }],
      },
    },
  });
}
