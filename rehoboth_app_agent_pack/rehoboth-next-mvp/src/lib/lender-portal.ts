import { getPrisma } from "./prisma";

type LenderPortalProgram = {
  id: string;
  name: string;
  rateRange: string;
  maxLeverage: string;
  termOptions: string;
  recourse: string;
  turnTime: string;
};

type LenderPortalLender = {
  lenderName: string;
  contactName: string;
  contactEmail: string;
  updatedAtLabel: string;
  dealTypes: string[];
  propertyFocus: string[];
  markets: string[];
  notes: string[];
  programs: LenderPortalProgram[];
  liveFiles: string[];
  activeMatchCount: number;
  targetedCount: number;
  submittedCount: number;
  quoteCount: number;
};

function createEmptyLender(lenderName: string): LenderPortalLender {
  return {
    lenderName,
    contactName: "",
    contactEmail: "",
    updatedAtLabel: "",
    dealTypes: [],
    propertyFocus: [],
    markets: [],
    notes: [],
    programs: [],
    liveFiles: [],
    activeMatchCount: 0,
    targetedCount: 0,
    submittedCount: 0,
    quoteCount: 0,
  };
}

function appendUnique(target: string[], value?: string | null) {
  if (!value || target.includes(value)) {
    return;
  }

  target.push(value);
}

export async function getLenderPortalPageData() {
  const prisma = getPrisma();

  const [ratesheets, matches] = await Promise.all([
    prisma.lenderRatesheet.findMany({
      orderBy: [{ lenderName: "asc" }, { programName: "asc" }],
    }),
    prisma.capitalSourceMatch.findMany({
      include: {
        deal: {
          select: {
            name: true,
          },
        },
      },
      orderBy: [{ lenderName: "asc" }, { updatedAt: "desc" }],
    }),
  ]);

  const lenderMap = new Map<string, LenderPortalLender>();

  for (const sheet of ratesheets) {
    const lender =
      lenderMap.get(sheet.lenderName) ?? createEmptyLender(sheet.lenderName);

    if (!lenderMap.has(sheet.lenderName)) {
      lenderMap.set(sheet.lenderName, lender);
    }

    if (!lender.contactName) {
      lender.contactName = sheet.contactName;
    }

    if (!lender.contactEmail) {
      lender.contactEmail = sheet.contactEmail;
    }

    if (!lender.updatedAtLabel) {
      lender.updatedAtLabel = sheet.updatedAtLabel;
    }

    appendUnique(lender.dealTypes, sheet.dealTypes);
    appendUnique(lender.propertyFocus, sheet.propertyFocus);
    appendUnique(lender.markets, sheet.markets);
    appendUnique(lender.notes, sheet.notes);

    lender.programs.push({
      id: sheet.id,
      name: sheet.programName,
      rateRange: sheet.rateRange,
      maxLeverage: sheet.maxLeverage,
      termOptions: sheet.termOptions,
      recourse: sheet.recourse,
      turnTime: sheet.turnTime,
    });
  }

  for (const match of matches) {
    const lender =
      lenderMap.get(match.lenderName) ?? createEmptyLender(match.lenderName);

    if (!lenderMap.has(match.lenderName)) {
      lenderMap.set(match.lenderName, lender);
    }

    lender.activeMatchCount += 1;
    appendUnique(lender.liveFiles, match.deal.name);

    if (match.status === "TARGETED") {
      lender.targetedCount += 1;
    }

    if (match.status === "SUBMITTED") {
      lender.submittedCount += 1;
    }

    if (match.status === "QUOTE_RECEIVED") {
      lender.quoteCount += 1;
    }
  }

  const lenders = Array.from(lenderMap.values()).sort((left, right) =>
    left.lenderName.localeCompare(right.lenderName),
  );

  return {
    metrics: {
      lendersTracked: lenders.length,
      programsTracked: ratesheets.length,
      liveMatches: matches.length,
      quotesReceived: matches.filter((match) => match.status === "QUOTE_RECEIVED")
        .length,
    },
    lenders,
  };
}
