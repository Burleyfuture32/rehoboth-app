import { DealType, TaskStatus } from "@prisma/client";
import { getPrisma } from "./prisma";

export async function getDashboardData() {
  const prisma = getPrisma();
  const [deals, openTasks] = await Promise.all([
    prisma.deal.findMany({
      include: {
        borrower: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    }),
    prisma.task.count({
      where: {
        status: TaskStatus.OPEN,
      },
    }),
  ]);

  const totalVolume = deals.reduce((sum, deal) => sum + deal.loanAmount, 0);
  const residentialCount = deals.filter(
    (deal) => deal.dealType === DealType.RESIDENTIAL,
  ).length;
  const creCount = deals.filter((deal) => deal.dealType === DealType.CRE).length;

  const sourceCounts = deals.reduce<Record<string, number>>((accumulator, deal) => {
    accumulator[deal.source] = (accumulator[deal.source] ?? 0) + 1;
    return accumulator;
  }, {});

  return {
    deals,
    metrics: {
      totalDeals: deals.length,
      residentialCount,
      creCount,
      totalVolume,
      openTasks,
    },
    sources: Object.entries(sourceCounts).sort((left, right) => right[1] - left[1]),
  };
}
