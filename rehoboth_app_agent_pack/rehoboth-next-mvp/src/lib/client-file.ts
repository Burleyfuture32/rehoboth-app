import { getPrisma } from "./prisma";

export async function getClientFileData(dealId: string) {
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
    },
  });

  if (!deal) {
    return null;
  }

  const currentTime = new Date();
  const overdueTaskCount = deal.tasks.filter(
    (task) => task.status === "OPEN" && task.dueDate < currentTime,
  ).length;

  return {
    ...deal,
    overdueTaskCount,
  };
}
