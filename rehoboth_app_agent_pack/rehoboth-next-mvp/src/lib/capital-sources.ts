import { CapitalSourceStatus } from "@prisma/client";
import { getPrisma } from "./prisma";

export async function getCapitalSourcesPageData() {
  const prisma = getPrisma();

  const matches = await prisma.capitalSourceMatch.findMany({
    include: {
      deal: {
        include: {
          borrower: true,
        },
      },
    },
    orderBy: [{ status: "asc" }, { updatedAt: "desc" }],
  });

  const counts = Object.values(CapitalSourceStatus).map((status) => ({
    status,
    count: matches.filter((match) => match.status === status).length,
  }));

  return {
    matches,
    counts,
  };
}
