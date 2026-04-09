import { DocumentStatus, TaskStatus } from "@prisma/client";
import { getPrisma } from "./prisma";

export type ClientDealSummary = {
  id: string;
  name: string;
  dealType: string;
  stage: string;
  program: string;
  market: string;
  propertyAddress: string;
  loanAmount: number;
  targetCloseDate: Date;
  openTasks: number;
  pendingDocuments: number;
};

export type ClientSummary = {
  id: string;
  name: string;
  entityType: string;
  experience: string | null;
  email: string;
  phone: string;
  deals: ClientDealSummary[];
  totalDeals: number;
  totalVolume: number;
  openTasks: number;
  pendingDocuments: number;
  latestDeal?: ClientDealSummary;
};

export type QuickAccessDealPayload = Omit<ClientDealSummary, "targetCloseDate"> & {
  targetCloseDate: string;
};

export type QuickAccessClientPayload = Omit<
  ClientSummary,
  "deals" | "latestDeal"
> & {
  deals: QuickAccessDealPayload[];
  latestDeal?: QuickAccessDealPayload;
};

export async function getClientsData() {
  const borrowers = await getBorrowersWithDeals();
  const clients = mapBorrowersToClients(borrowers);
  const entityMix = clients.reduce<Record<string, number>>((accumulator, client) => {
    accumulator[client.entityType] = (accumulator[client.entityType] ?? 0) + 1;
    return accumulator;
  }, {});

  return {
    clients,
    metrics: {
      totalClients: clients.length,
      totalDeals: clients.reduce((sum, client) => sum + client.totalDeals, 0),
      totalVolume: clients.reduce((sum, client) => sum + client.totalVolume, 0),
      clientsNeedingAttention: clients.filter(
        (client) => client.openTasks > 0 || client.pendingDocuments > 0,
      ).length,
    },
    entityMix: Object.entries(entityMix).sort((left, right) => right[1] - left[1]),
  };
}

export async function getQuickAccessClients() {
  const { clients } = await getClientsData();

  return clients
    .slice()
    .sort((left, right) => getQuickAccessRank(right) - getQuickAccessRank(left));
}

export async function getQuickAccessClientById(clientId: string) {
  const clients = await getQuickAccessClients();
  return clients.find((client) => client.id === clientId) ?? null;
}

export function getDefaultQuickAccessClientId(clients: ClientSummary[]) {
  return clients.find((client) => client.name === "Tim Webb")?.id ?? clients[0]?.id ?? null;
}

export function toQuickAccessClientPayload(
  client: ClientSummary,
): QuickAccessClientPayload {
  return {
    ...client,
    deals: client.deals.map((deal) => ({
      ...deal,
      targetCloseDate: deal.targetCloseDate.toISOString(),
    })),
    latestDeal: client.latestDeal
      ? {
          ...client.latestDeal,
          targetCloseDate: client.latestDeal.targetCloseDate.toISOString(),
        }
      : undefined,
  };
}

async function getBorrowersWithDeals() {
  const prisma = getPrisma();

  return prisma.borrower.findMany({
    include: {
      deals: {
        include: {
          tasks: {
            where: {
              status: TaskStatus.OPEN,
            },
            select: {
              id: true,
            },
          },
          documentRequests: {
            where: {
              status: DocumentStatus.REQUESTED,
            },
            select: {
              id: true,
            },
          },
        },
        orderBy: {
          updatedAt: "desc",
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

function mapBorrowersToClients(
  borrowers: Awaited<ReturnType<typeof getBorrowersWithDeals>>,
): ClientSummary[] {
  return borrowers.map((borrower) => {
    const deals = borrower.deals.map((deal) => ({
      id: deal.id,
      name: deal.name,
      dealType: deal.dealType,
      stage: deal.stage,
      program: deal.program,
      market: deal.market,
      propertyAddress: deal.propertyAddress,
      loanAmount: deal.loanAmount,
      targetCloseDate: deal.targetCloseDate,
      openTasks: deal.tasks.length,
      pendingDocuments: deal.documentRequests.length,
    }));

    const totalVolume = deals.reduce((sum, deal) => sum + deal.loanAmount, 0);
    const openTasks = deals.reduce((sum, deal) => sum + deal.openTasks, 0);
    const pendingDocuments = deals.reduce(
      (sum, deal) => sum + deal.pendingDocuments,
      0,
    );

    return {
      id: borrower.id,
      name: borrower.name,
      entityType: borrower.entityType,
      experience: borrower.experience,
      email: borrower.email,
      phone: borrower.phone,
      deals,
      totalDeals: deals.length,
      totalVolume,
      openTasks,
      pendingDocuments,
      latestDeal: deals[0],
    };
  });
}

function getQuickAccessRank(client: ClientSummary) {
  return (
    client.openTasks * 5 +
    client.pendingDocuments * 4 +
    client.totalDeals * 2 +
    client.totalVolume / 1000000
  );
}
