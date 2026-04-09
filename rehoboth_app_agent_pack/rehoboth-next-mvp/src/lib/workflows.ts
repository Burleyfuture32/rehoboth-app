import { getPrisma } from "./prisma";
import { workflowTemplates } from "./workflow-templates";

export async function getWorkflowCenterData(dealId?: string) {
  const prisma = getPrisma();

  const [dealOptions, selectedDeal, workflowActivities] = await Promise.all([
    prisma.deal.findMany({
      select: {
        id: true,
        name: true,
        dealType: true,
        stage: true,
        borrower: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    }),
    dealId
      ? prisma.deal.findUnique({
          where: {
            id: dealId,
          },
          include: {
            borrower: true,
            loanFile: {
              select: {
                recommendedAction: true,
                submissionStatus: true,
              },
            },
            tasks: {
              orderBy: [{ status: "asc" }, { dueDate: "asc" }],
            },
            documentRequests: {
              orderBy: [{ status: "asc" }, { createdAt: "asc" }],
            },
            capitalSources: {
              orderBy: [{ status: "asc" }, { updatedAt: "desc" }],
            },
          },
        })
      : Promise.resolve(null),
    prisma.dealActivity.findMany({
      where: {
        kind: "WORKFLOW",
        dealId,
      },
      include: {
        deal: {
          include: {
            borrower: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 12,
    }),
  ]);

  return {
    dealOptions,
    selectedDeal,
    templates: workflowTemplates,
    workflowActivities,
  };
}
