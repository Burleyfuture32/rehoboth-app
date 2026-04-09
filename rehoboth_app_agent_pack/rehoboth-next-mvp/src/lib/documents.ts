import { DocumentStatus } from "@prisma/client";
import { getPrisma } from "./prisma";

export async function getDocumentCenterData(dealId?: string) {
  const prisma = getPrisma();
  const where = dealId ? { id: dealId } : undefined;

  const [dealOptions, deals] = await Promise.all([
    prisma.deal.findMany({
      select: {
        id: true,
        name: true,
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
    prisma.deal.findMany({
      where,
      include: {
        borrower: true,
        loanFile: true,
        capitalSources: {
          orderBy: [{ status: "asc" }, { updatedAt: "desc" }],
        },
        documentRequests: {
          orderBy: [{ status: "asc" }, { createdAt: "asc" }],
        },
        tasks: {
          orderBy: [{ status: "asc" }, { dueDate: "asc" }],
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    }),
  ]);

  const documents = deals.flatMap((deal) => deal.documentRequests);

  return {
    dealOptions,
    deals,
    selectedDeal: dealId ? deals[0] ?? null : null,
    metrics: {
      requested: documents.filter(
        (document) => document.status === DocumentStatus.REQUESTED,
      ).length,
      uploaded: documents.filter(
        (document) => document.status === DocumentStatus.UPLOADED,
      ).length,
      totalDeals: deals.length,
    },
  };
}
