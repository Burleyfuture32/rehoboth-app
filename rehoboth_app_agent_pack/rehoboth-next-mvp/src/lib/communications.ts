import { CommunicationChannel } from "@prisma/client";
import { getPrisma } from "./prisma";

export async function getCommunicationsPageData(dealId: string) {
  const prisma = getPrisma();

  const deal = await prisma.deal.findUnique({
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
      communicationLogs: {
        orderBy: {
          createdAt: "desc",
        },
      },
    },
  });

  if (!deal) {
    return null;
  }

  const counts = Object.values(CommunicationChannel).map((channel) => ({
    channel,
    count: deal.communicationLogs.filter((entry) => entry.channel === channel).length,
  }));

  return {
    counts,
    deal,
  };
}
