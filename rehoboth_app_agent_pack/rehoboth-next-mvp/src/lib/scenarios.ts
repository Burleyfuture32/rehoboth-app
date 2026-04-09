import { currency } from "./format";
import { getPrisma } from "./prisma";

type DealTypeValue = "CRE" | "RESIDENTIAL";

type ScenarioRawInput = Partial<{
  scenarioName: string;
  dealType: string;
  loanAmount: string;
  leverage: string;
  dscr: string;
  fico: string;
  market: string;
  propertyType: string;
}>;

export type ScenarioInput = {
  scenarioName: string;
  dealType: DealTypeValue;
  loanAmount: number;
  leverage: number;
  dscr: number | null;
  fico: number | null;
  market: string;
  propertyType: string;
};

export type ScenarioPreset = {
  label: string;
  description: string;
  values: Record<string, string>;
};

type ScenarioComparison = {
  id: string;
  lenderName: string;
  programName: string;
  fitScore: number;
  fitLabel: "Strong fit" | "Viable fit" | "Conditional fit" | "Stretch fit";
  fitTone: string;
  matchedReasons: string[];
  watchouts: string[];
  loanRangeLabel: string;
  rateRange: string;
  rateMidpoint: number | null;
  maxLeverage: string;
  minDscr: string;
  minFico: string;
  termOptions: string;
  recourse: string;
  turnTime: string;
  contactName: string;
  contactEmail: string;
  markets: string;
  propertyFocus: string;
  updatedAtLabel: string;
  liveMatchCount: number;
};

const defaultScenario: ScenarioInput = {
  scenarioName: "Southeast CRE bridge",
  dealType: "CRE",
  loanAmount: 1850000,
  leverage: 70,
  dscr: 1.25,
  fico: null,
  market: "Georgia",
  propertyType: "mixed-use commercial",
};

export const scenarioPresets: ScenarioPreset[] = [
  {
    label: "Bean Path Bridge",
    description: "CRE bridge-style file with 70 percent leverage.",
    values: {
      scenarioName: "Bean Path bridge refresh",
      dealType: "CRE",
      loanAmount: "1850000",
      leverage: "70",
      dscr: "1.25",
      market: "Mississippi",
      propertyType: "mixed-use commercial",
    },
  },
  {
    label: "Tim Webb Conventional",
    description: "Residential owner-occupied file with strong credit.",
    values: {
      scenarioName: "Tim Webb purchase",
      dealType: "RESIDENTIAL",
      loanAmount: "328000",
      leverage: "80",
      fico: "714",
      market: "Georgia",
      propertyType: "primary residence",
    },
  },
  {
    label: "DSCR Rental",
    description: "Investor rental scenario for DSCR lender comparison.",
    values: {
      scenarioName: "Atlanta DSCR rental",
      dealType: "RESIDENTIAL",
      loanAmount: "425000",
      leverage: "75",
      dscr: "1.10",
      fico: "690",
      market: "Georgia",
      propertyType: "rental property",
    },
  },
  {
    label: "Project Execution",
    description: "Later-stage acquisition or development execution file.",
    values: {
      scenarioName: "Patriot Square execution",
      dealType: "CRE",
      loanAmount: "2850000",
      leverage: "69",
      market: "Georgia",
      propertyType: "development project",
    },
  },
];

const southeastStateAliases: Record<string, string[]> = {
  alabama: ["alabama", "al"],
  florida: ["florida", "fl"],
  georgia: ["georgia", "ga"],
  mississippi: ["mississippi", "ms"],
  northcarolina: ["north carolina", "nc"],
  southcarolina: ["south carolina", "sc"],
  tennessee: ["tennessee", "tn"],
};

function readNumber(value?: string, fallback?: number) {
  if (!value?.trim()) {
    return fallback ?? null;
  }

  const parsed = Number(value.replace(/,/g, "").trim());
  if (Number.isFinite(parsed) && parsed >= 0) {
    return parsed;
  }

  return fallback ?? null;
}

function normalizeScenarioInput(raw: ScenarioRawInput) {
  const dealType: DealTypeValue =
    raw.dealType === "RESIDENTIAL" ? "RESIDENTIAL" : defaultScenario.dealType;

  const loanAmount = readNumber(raw.loanAmount, defaultScenario.loanAmount);
  const leverage = readNumber(raw.leverage, defaultScenario.leverage);
  const dscr = readNumber(raw.dscr);
  const fico = readNumber(raw.fico);

  return {
    scenarioName: raw.scenarioName?.trim() || defaultScenario.scenarioName,
    dealType,
    loanAmount: typeof loanAmount === "number" ? loanAmount : defaultScenario.loanAmount,
    leverage: typeof leverage === "number" ? leverage : defaultScenario.leverage,
    dscr: typeof dscr === "number" ? dscr : null,
    fico: typeof fico === "number" ? fico : null,
    market: raw.market?.trim() || defaultScenario.market,
    propertyType: raw.propertyType?.trim() || defaultScenario.propertyType,
  } satisfies ScenarioInput;
}

function parseCurrencyValue(value?: string | null) {
  if (!value) {
    return null;
  }

  const numeric = value.replace(/[^\d.]/g, "");
  if (!numeric) {
    return null;
  }

  const parsed = Number(numeric);
  return Number.isFinite(parsed) ? parsed : null;
}

function parsePercentMax(value?: string | null) {
  if (!value) {
    return null;
  }

  const matches = Array.from(value.matchAll(/(\d+(?:\.\d+)?)\s*%/g)).map((match) =>
    Number(match[1]),
  );

  if (matches.length === 0) {
    return null;
  }

  return Math.max(...matches);
}

function parseRateMidpoint(value?: string | null) {
  if (!value) {
    return null;
  }

  const matches = Array.from(value.matchAll(/(\d+(?:\.\d+)?)\s*%/g)).map((match) =>
    Number(match[1]),
  );

  if (matches.length === 0) {
    return null;
  }

  const total = matches.reduce((sum, current) => sum + current, 0);
  return total / matches.length;
}

function parseTurnDays(value?: string | null) {
  if (!value) {
    return null;
  }

  const matches = Array.from(value.matchAll(/(\d+(?:\.\d+)?)/g)).map((match) =>
    Number(match[1]),
  );

  if (matches.length === 0) {
    return null;
  }

  return matches[0];
}

function normalizeText(value?: string | null) {
  return (value ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function marketMatches(lenderMarkets: string, scenarioMarket: string) {
  const lender = normalizeText(lenderMarkets);
  const scenario = normalizeText(scenarioMarket);

  if (!scenario || !lender) {
    return false;
  }

  if (lender.includes("nationwide")) {
    return true;
  }

  if (lender.includes(scenario)) {
    return true;
  }

  const stateKey = scenario.replace(/\s/g, "");
  const aliases = southeastStateAliases[stateKey];

  if (aliases?.some((alias) => lender.includes(normalizeText(alias)))) {
    return true;
  }

  if (lender.includes("southeast") && aliases) {
    return true;
  }

  return false;
}

function propertyMatches(propertyFocus: string, scenarioPropertyType: string) {
  const focus = normalizeText(propertyFocus);
  const property = normalizeText(scenarioPropertyType);

  if (!focus || !property) {
    return false;
  }

  if (focus.includes(property) || property.includes(focus)) {
    return true;
  }

  const propertyTokens = property.split(" ").filter((token) => token.length > 3);
  return propertyTokens.some((token) => focus.includes(token));
}

function buildComparison(args: {
  sheet: {
    id: string;
    lenderName: string;
    programName: string;
    dealTypes: string;
    propertyFocus: string;
    markets: string;
    minLoanAmount: string;
    maxLoanAmount: string;
    maxLeverage: string;
    minDscr: string | null;
    minFico: string | null;
    rateRange: string;
    termOptions: string;
    recourse: string;
    turnTime: string;
    contactName: string;
    contactEmail: string;
    updatedAtLabel: string;
  };
  liveMatchCount: number;
  scenario: ScenarioInput;
}): ScenarioComparison {
  const { sheet, liveMatchCount, scenario } = args;
  const matchedReasons: string[] = [];
  const watchouts: string[] = [];
  let fitScore = 0;

  if (sheet.dealTypes.includes(scenario.dealType)) {
    fitScore += 26;
    matchedReasons.push(`Covers ${scenario.dealType} deals.`);
  } else {
    watchouts.push(`Program is saved for ${sheet.dealTypes} files, not ${scenario.dealType}.`);
  }

  const minLoanAmount = parseCurrencyValue(sheet.minLoanAmount);
  const maxLoanAmount = parseCurrencyValue(sheet.maxLoanAmount);
  if (
    minLoanAmount !== null &&
    maxLoanAmount !== null &&
    scenario.loanAmount >= minLoanAmount &&
    scenario.loanAmount <= maxLoanAmount
  ) {
    fitScore += 22;
    matchedReasons.push(
      `Requested amount fits the ${currency(minLoanAmount)} to ${currency(maxLoanAmount)} lane.`,
    );
  } else {
    watchouts.push(
      `Requested amount sits outside the listed ${sheet.minLoanAmount} to ${sheet.maxLoanAmount} range.`,
    );
  }

  const maxLeverage = parsePercentMax(sheet.maxLeverage);
  if (maxLeverage !== null && scenario.leverage <= maxLeverage) {
    fitScore += 18;
    matchedReasons.push(`Leverage target is inside the listed ${sheet.maxLeverage} ceiling.`);
  } else if (maxLeverage !== null) {
    watchouts.push(
      `Scenario leverage of ${scenario.leverage}% is above the listed ${sheet.maxLeverage} cap.`,
    );
  }

  const minDscr = readNumber(sheet.minDscr ?? undefined);
  if (scenario.dscr !== null) {
    if (typeof minDscr === "number" && scenario.dscr >= minDscr) {
      fitScore += 10;
      matchedReasons.push(`DSCR clears the listed ${minDscr.toFixed(2)} minimum.`);
    } else if (typeof minDscr === "number") {
      watchouts.push(
        `Scenario DSCR of ${scenario.dscr.toFixed(2)} misses the listed ${minDscr.toFixed(2)} minimum.`,
      );
    } else {
      fitScore += 4;
    }
  }

  const minFico = readNumber(sheet.minFico ?? undefined);
  if (scenario.fico !== null) {
    if (typeof minFico === "number" && scenario.fico >= minFico) {
      fitScore += 10;
      matchedReasons.push(`Credit clears the listed ${minFico} FICO minimum.`);
    } else if (typeof minFico === "number") {
      watchouts.push(
        `Scenario FICO of ${Math.round(scenario.fico)} misses the listed ${Math.round(minFico)} minimum.`,
      );
    } else {
      fitScore += 4;
    }
  }

  if (marketMatches(sheet.markets, scenario.market)) {
    fitScore += 6;
    matchedReasons.push(`Listed market coverage includes ${scenario.market}.`);
  } else {
    watchouts.push(`Market coverage does not clearly mention ${scenario.market}.`);
  }

  if (propertyMatches(sheet.propertyFocus, scenario.propertyType)) {
    fitScore += 8;
    matchedReasons.push(`Property focus lines up with ${scenario.propertyType}.`);
  } else {
    watchouts.push(`Property focus does not clearly match ${scenario.propertyType}.`);
  }

  if (liveMatchCount > 0) {
    fitScore += 6;
    matchedReasons.push(
      `${liveMatchCount} live file${liveMatchCount === 1 ? "" : "s"} already tracked with this lender.`,
    );
  }

  let fitLabel: ScenarioComparison["fitLabel"] = "Stretch fit";
  let fitTone = "border-amber-200 bg-amber-50 text-amber-800";
  if (fitScore >= 80) {
    fitLabel = "Strong fit";
    fitTone = "border-emerald-200 bg-emerald-50 text-emerald-800";
  } else if (fitScore >= 65) {
    fitLabel = "Viable fit";
    fitTone = "border-sky-200 bg-sky-50 text-sky-800";
  } else if (fitScore >= 50) {
    fitLabel = "Conditional fit";
    fitTone = "border-violet-200 bg-violet-50 text-violet-800";
  }

  return {
    id: sheet.id,
    lenderName: sheet.lenderName,
    programName: sheet.programName,
    fitScore,
    fitLabel,
    fitTone,
    matchedReasons,
    watchouts,
    loanRangeLabel: `${sheet.minLoanAmount} to ${sheet.maxLoanAmount}`,
    rateRange: sheet.rateRange,
    rateMidpoint: parseRateMidpoint(sheet.rateRange),
    maxLeverage: sheet.maxLeverage,
    minDscr: sheet.minDscr || "-",
    minFico: sheet.minFico || "-",
    termOptions: sheet.termOptions,
    recourse: sheet.recourse,
    turnTime: sheet.turnTime,
    contactName: sheet.contactName,
    contactEmail: sheet.contactEmail,
    markets: sheet.markets,
    propertyFocus: sheet.propertyFocus,
    updatedAtLabel: sheet.updatedAtLabel,
    liveMatchCount,
  };
}

export async function getScenarioDeskData(raw: ScenarioRawInput = {}) {
  const prisma = getPrisma();
  const scenario = normalizeScenarioInput(raw);

  const [ratesheets, liveMatches] = await Promise.all([
    prisma.lenderRatesheet.findMany({
      orderBy: [{ lenderName: "asc" }, { programName: "asc" }],
    }),
    prisma.capitalSourceMatch.findMany({
      select: {
        lenderName: true,
      },
    }),
  ]);

  const liveMatchCountByLender = new Map<string, number>();
  for (const match of liveMatches) {
    liveMatchCountByLender.set(
      match.lenderName,
      (liveMatchCountByLender.get(match.lenderName) ?? 0) + 1,
    );
  }

  const comparisons = ratesheets
    .map((sheet) =>
      buildComparison({
        sheet,
        liveMatchCount: liveMatchCountByLender.get(sheet.lenderName) ?? 0,
        scenario,
      }),
    )
    .sort((left, right) => {
      if (right.fitScore !== left.fitScore) {
        return right.fitScore - left.fitScore;
      }

      if (right.liveMatchCount !== left.liveMatchCount) {
        return right.liveMatchCount - left.liveMatchCount;
      }

      const leftRate = left.rateMidpoint ?? Number.POSITIVE_INFINITY;
      const rightRate = right.rateMidpoint ?? Number.POSITIVE_INFINITY;
      if (leftRate !== rightRate) {
        return leftRate - rightRate;
      }

      return left.lenderName.localeCompare(right.lenderName);
    });

  const strongFits = comparisons.filter((comparison) => comparison.fitScore >= 80);
  const viableFits = comparisons.filter((comparison) => comparison.fitScore >= 65);
  const lowestRate = viableFits
    .filter((comparison) => comparison.rateMidpoint !== null)
    .toSorted(
      (left, right) =>
        (left.rateMidpoint ?? Number.POSITIVE_INFINITY) -
        (right.rateMidpoint ?? Number.POSITIVE_INFINITY),
    )[0];
  const fastestTurn = viableFits
    .filter((comparison) => parseTurnDays(comparison.turnTime) !== null)
    .toSorted(
      (left, right) =>
        (parseTurnDays(left.turnTime) ?? Number.POSITIVE_INFINITY) -
        (parseTurnDays(right.turnTime) ?? Number.POSITIVE_INFINITY),
    )[0];

  return {
    scenario,
    comparisons,
    metrics: {
      comparedPrograms: comparisons.length,
      strongFits: strongFits.length,
      viableFits: viableFits.length,
      lowestRateLabel: lowestRate ? lowestRate.rateRange : "No rate listed",
      fastestTurnLabel: fastestTurn ? fastestTurn.turnTime : "No turn time listed",
    },
  };
}
