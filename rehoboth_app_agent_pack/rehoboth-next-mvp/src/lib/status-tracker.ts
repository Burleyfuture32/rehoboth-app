import {
  CapitalSourceStatus,
  DealStage,
  DocumentStatus,
  Prisma,
  PrismaClient,
  StatusTrackerSectionKey,
  StatusTrackerStatus,
  SubmissionStatus,
  TaskStatus,
} from "@prisma/client";
import { getPrisma } from "./prisma";

const defaultLoOwner = "Kelvin Abram";

const sectionConfig = {
  [StatusTrackerSectionKey.BORROWER]: { label: "Borrower", dueOffsetDays: -21 },
  [StatusTrackerSectionKey.LO]: { label: "LO", dueOffsetDays: -14 },
  [StatusTrackerSectionKey.TITLE]: { label: "Title", dueOffsetDays: -10 },
  [StatusTrackerSectionKey.LENDER]: { label: "Lender", dueOffsetDays: -7 },
  [StatusTrackerSectionKey.CLOSING]: { label: "Closing", dueOffsetDays: -2 },
} as const;

export const statusTrackerSectionOrder = [
  StatusTrackerSectionKey.BORROWER,
  StatusTrackerSectionKey.LO,
  StatusTrackerSectionKey.TITLE,
  StatusTrackerSectionKey.LENDER,
  StatusTrackerSectionKey.CLOSING,
] as const;

export const statusTrackerFilterValues = [
  "all",
  "overdue",
  "pending",
  "complete",
] as const;

export type StatusTrackerFilter = (typeof statusTrackerFilterValues)[number];

type DealTrackerContext = NonNullable<Awaited<ReturnType<typeof loadDealTrackerContext>>>;
type TrackerSection = DealTrackerContext["statusTrackerSections"][number];

export function getStatusTrackerLabel(sectionKey: StatusTrackerSectionKey) {
  return sectionConfig[sectionKey].label;
}

export function formatStatusTrackerValue(value: StatusTrackerStatus | StatusTrackerSectionKey) {
  return value.replaceAll("_", " ");
}

export function getStatusTrackerTone(status: StatusTrackerStatus) {
  switch (status) {
    case StatusTrackerStatus.COMPLETE:
      return "border-emerald-200 bg-emerald-50 text-emerald-900";
    case StatusTrackerStatus.PENDING:
      return "border-amber-200 bg-amber-50 text-amber-900";
    case StatusTrackerStatus.IN_PROGRESS:
      return "border-sky-200 bg-sky-50 text-sky-900";
    case StatusTrackerStatus.OVERDUE:
      return "border-rose-200 bg-rose-50 text-rose-900";
    default:
      return "border-slate-200 bg-slate-100 text-slate-700";
  }
}

export function getStatusTrackerProgressSummary(
  sections: Array<{
    status: StatusTrackerStatus;
    isBlocked: boolean;
    isOverdue: boolean;
    sectionKey: StatusTrackerSectionKey;
    notes: string | null;
    blockerReason: string | null;
  }>,
) {
  const totalSections = sections.length;
  const completedSections = sections.filter(
    (section) => section.status === StatusTrackerStatus.COMPLETE,
  ).length;
  const overdueSections = sections.filter(
    (section) => section.isOverdue || section.status === StatusTrackerStatus.OVERDUE,
  );
  const pendingSections = sections.filter(
    (section) => section.status === StatusTrackerStatus.PENDING,
  ).length;
  const inProgressSections = sections.filter(
    (section) => section.status === StatusTrackerStatus.IN_PROGRESS,
  ).length;
  const activeBlocker =
    overdueSections[0] ?? sections.find((section) => section.isBlocked) ?? null;

  return {
    totalSections,
    completedSections,
    pendingSections,
    inProgressSections,
    overdueSectionsCount: overdueSections.length,
    overallPercent: totalSections
      ? Math.round((completedSections / totalSections) * 100)
      : 0,
    activeBlockerSummary: activeBlocker
      ? `${getStatusTrackerLabel(activeBlocker.sectionKey)}: ${activeBlocker.blockerReason ?? activeBlocker.notes ?? "Needs attention"}`
      : null,
  };
}

export function getStatusTrackerFilter(value: string | undefined): StatusTrackerFilter {
  if (value && statusTrackerFilterValues.includes(value as StatusTrackerFilter)) {
    return value as StatusTrackerFilter;
  }

  return "all";
}

export function filterStatusTrackerSections<
  T extends {
    status: StatusTrackerStatus;
    isOverdue: boolean;
  },
>(sections: T[], filter: StatusTrackerFilter) {
  switch (filter) {
    case "overdue":
      return sections.filter(
        (section) =>
          section.isOverdue || section.status === StatusTrackerStatus.OVERDUE,
      );
    case "pending":
      return sections.filter((section) =>
        ([
          StatusTrackerStatus.PENDING,
          StatusTrackerStatus.IN_PROGRESS,
          StatusTrackerStatus.NOT_STARTED,
        ] as StatusTrackerStatus[]).includes(section.status),
      );
    case "complete":
      return sections.filter(
        (section) => section.status === StatusTrackerStatus.COMPLETE,
      );
    default:
      return sections;
  }
}

export function buildStatusTrackerSectionsForCreate({
  borrowerName,
  capitalSourceName,
  closingAttorney,
  targetCloseDate,
}: {
  borrowerName: string;
  capitalSourceName?: string | null;
  closingAttorney?: string | null;
  targetCloseDate: Date;
}) {
  return statusTrackerSectionOrder.map((sectionKey) => ({
    sectionKey,
    status: StatusTrackerStatus.NOT_STARTED,
    personOrCompanyName: getDefaultPersonOrCompanyName({
      borrowerName,
      capitalSourceName,
      closingAttorney,
      sectionKey,
    }),
    assignedToName: getDefaultAssignedToName(sectionKey),
    notes: getDefaultSectionNote(sectionKey),
    dueDate: addDays(targetCloseDate, sectionConfig[sectionKey].dueOffsetDays),
    percentComplete: 0,
    updatedByName: "System",
  }));
}

export async function ensureStatusTrackerSections(
  prisma: PrismaClient,
  dealId: string,
) {
  const deal = await prisma.deal.findUnique({
    where: { id: dealId },
    select: {
      id: true,
      targetCloseDate: true,
      borrower: { select: { name: true } },
      loanFile: { select: { closingAttorney: true } },
      capitalSources: {
        select: { lenderName: true },
        orderBy: { updatedAt: "desc" },
        take: 1,
      },
      statusTrackerSections: { select: { sectionKey: true } },
    },
  });

  if (!deal) {
    return false;
  }

  const existingKeys = new Set(
    deal.statusTrackerSections.map((section) => section.sectionKey),
  );
  const missingKeys = statusTrackerSectionOrder.filter(
    (sectionKey) => !existingKeys.has(sectionKey),
  );

  if (missingKeys.length === 0) {
    return true;
  }

  const starterSections = buildStatusTrackerSectionsForCreate({
    borrowerName: deal.borrower.name,
    capitalSourceName: deal.capitalSources[0]?.lenderName ?? null,
    closingAttorney: deal.loanFile?.closingAttorney ?? null,
    targetCloseDate: deal.targetCloseDate,
  }).filter((section) => missingKeys.includes(section.sectionKey));

  await prisma.statusTrackerSection.createMany({
    data: starterSections.map((section) => ({
      dealId,
      ...section,
    })),
  });

  return true;
}

export async function getStatusTrackerPageData(dealId: string) {
  const prisma = getPrisma();
  const ensured = await ensureStatusTrackerSections(prisma, dealId);

  if (!ensured) {
    return null;
  }

  await recalculateStatusTrackerForDeal(prisma, dealId, {
    actor: "System",
    logActivity: false,
  });

  const deal = await prisma.deal.findUnique({
    where: { id: dealId },
    include: {
      borrower: true,
      statusTrackerSections: true,
      activities: {
        where: { kind: "STATUS_TRACKER" },
        orderBy: { createdAt: "desc" },
        take: 6,
      },
    },
  });

  if (!deal) {
    return null;
  }

  const sections = [...deal.statusTrackerSections].sort(
    (left, right) =>
      statusTrackerSectionOrder.indexOf(left.sectionKey) -
      statusTrackerSectionOrder.indexOf(right.sectionKey),
  );

  return {
    deal,
    sections,
    summary: getStatusTrackerProgressSummary(sections),
  };
}

export async function recalculateStatusTrackerForDeal(
  prisma: PrismaClient,
  dealId: string,
  {
    actor,
    logActivity,
  }: {
    actor: string;
    logActivity: boolean;
  },
) {
  const ensured = await ensureStatusTrackerSections(prisma, dealId);

  if (!ensured) {
    return null;
  }

  const deal = await loadDealTrackerContext(prisma, dealId);

  if (!deal) {
    return null;
  }

  const sectionUpdates: Prisma.PrismaPromise<unknown>[] = [];
  const changeSummaries: string[] = [];

  for (const sectionKey of statusTrackerSectionOrder) {
    const section = deal.statusTrackerSections.find(
      (item) => item.sectionKey === sectionKey,
    );

    if (!section) {
      continue;
    }

    const nextValues = section.manualOverride
      ? getManualSectionState(section, deal)
      : getAutomaticSectionState(section, deal);
    const updateData = getSectionUpdateData(section, nextValues, actor);

    if (!updateData) {
      continue;
    }

    sectionUpdates.push(
      prisma.statusTrackerSection.update({
        where: { id: section.id },
        data: updateData,
      }),
    );

    if (section.status !== nextValues.status) {
      changeSummaries.push(
        `${getStatusTrackerLabel(section.sectionKey)} ${formatStatusTrackerValue(section.status).toLowerCase()} -> ${formatStatusTrackerValue(nextValues.status).toLowerCase()}`,
      );
    }
  }

  if (sectionUpdates.length > 0) {
    await prisma.$transaction(sectionUpdates);
  }

  if (logActivity && changeSummaries.length > 0) {
    await prisma.dealActivity.create({
      data: {
        dealId,
        title: "Status tracker recalculated",
        body: changeSummaries.join("; "),
        createdBy: actor,
        kind: "STATUS_TRACKER",
      },
    });
  }

  return { changedSections: changeSummaries.length };
}

async function loadDealTrackerContext(prisma: PrismaClient, dealId: string) {
  return prisma.deal.findUnique({
    where: { id: dealId },
    include: {
      borrower: true,
      loanFile: true,
      tasks: {
        orderBy: [{ status: "asc" }, { dueDate: "asc" }],
      },
      documentRequests: {
        orderBy: [{ status: "asc" }, { createdAt: "asc" }],
      },
      capitalSources: {
        orderBy: [{ status: "asc" }, { updatedAt: "desc" }],
      },
      statusTrackerSections: true,
    },
  });
}

function getSectionUpdateData(
  currentSection: TrackerSection,
  nextValues: ReturnType<typeof getAutomaticSectionState>,
  actor: string,
) {
  const dueDateChanged =
    (currentSection.dueDate?.toISOString() ?? null) !==
    (nextValues.dueDate?.toISOString() ?? null);

  if (
    currentSection.status === nextValues.status &&
    currentSection.personOrCompanyName === nextValues.personOrCompanyName &&
    currentSection.assignedToName === nextValues.assignedToName &&
    currentSection.notes === nextValues.notes &&
    currentSection.blockerReason === nextValues.blockerReason &&
    currentSection.percentComplete === nextValues.percentComplete &&
    currentSection.isBlocked === nextValues.isBlocked &&
    currentSection.isOverdue === nextValues.isOverdue &&
    !dueDateChanged
  ) {
    return null;
  }

  return {
    status: nextValues.status,
    personOrCompanyName: nextValues.personOrCompanyName,
    assignedToName: nextValues.assignedToName,
    notes: nextValues.notes,
    dueDate: nextValues.dueDate,
    blockerReason: nextValues.blockerReason,
    percentComplete: nextValues.percentComplete,
    isBlocked: nextValues.isBlocked,
    isOverdue: nextValues.isOverdue,
    updatedByName: actor,
  };
}

function getAutomaticSectionState(section: TrackerSection, deal: DealTrackerContext) {
  const dueDate =
    section.dueDate ?? getDefaultDueDate(section.sectionKey, deal.targetCloseDate);
  const personOrCompanyName =
    section.personOrCompanyName ??
    getDefaultPersonOrCompanyName({
      borrowerName: deal.borrower.name,
      capitalSourceName: deal.capitalSources[0]?.lenderName ?? null,
      closingAttorney: deal.loanFile?.closingAttorney ?? null,
      sectionKey: section.sectionKey,
    });
  const assignedToName =
    section.assignedToName ?? getDefaultAssignedToName(section.sectionKey);
  const sectionState = deriveAutoState(section.sectionKey, deal);
  const isOverdue = Boolean(
    dueDate &&
      dueDate.getTime() < Date.now() &&
      sectionState.status !== StatusTrackerStatus.COMPLETE,
  );
  const finalStatus = isOverdue ? StatusTrackerStatus.OVERDUE : sectionState.status;

  return {
    status: finalStatus,
    personOrCompanyName,
    assignedToName,
    notes: sectionState.notes,
    dueDate,
    blockerReason: sectionState.blockerReason,
    percentComplete: getPercentCompleteForStatus(
      finalStatus,
      sectionState.percentComplete,
    ),
    isBlocked: Boolean(sectionState.blockerReason),
    isOverdue,
  };
}

function getManualSectionState(section: TrackerSection, deal: DealTrackerContext) {
  const dueDate =
    section.dueDate ?? getDefaultDueDate(section.sectionKey, deal.targetCloseDate);
  const forcedOverdue =
    Boolean(dueDate) &&
    dueDate.getTime() < Date.now() &&
    section.status !== StatusTrackerStatus.COMPLETE;
  const status = forcedOverdue ? StatusTrackerStatus.OVERDUE : section.status;

  return {
    status,
    personOrCompanyName:
      section.personOrCompanyName ??
      getDefaultPersonOrCompanyName({
        borrowerName: deal.borrower.name,
        capitalSourceName: deal.capitalSources[0]?.lenderName ?? null,
        closingAttorney: deal.loanFile?.closingAttorney ?? null,
        sectionKey: section.sectionKey,
      }),
    assignedToName:
      section.assignedToName ?? getDefaultAssignedToName(section.sectionKey),
    notes: section.notes ?? getDefaultSectionNote(section.sectionKey),
    dueDate,
    blockerReason: section.blockerReason,
    percentComplete: getPercentCompleteForStatus(status, section.percentComplete),
    isBlocked: Boolean(section.blockerReason),
    isOverdue: forcedOverdue,
  };
}

function deriveAutoState(
  sectionKey: StatusTrackerSectionKey,
  deal: DealTrackerContext,
) {
  switch (sectionKey) {
    case StatusTrackerSectionKey.BORROWER:
      return deriveBorrowerSectionState(deal);
    case StatusTrackerSectionKey.LO:
      return deriveLoSectionState(deal);
    case StatusTrackerSectionKey.TITLE:
      return deriveTitleSectionState(deal);
    case StatusTrackerSectionKey.LENDER:
      return deriveLenderSectionState(deal);
    case StatusTrackerSectionKey.CLOSING:
      return deriveClosingSectionState(deal);
  }
}

function deriveBorrowerSectionState(deal: DealTrackerContext) {
  const requestedDocs = deal.documentRequests.filter(
    (document) => document.status === DocumentStatus.REQUESTED,
  );
  const uploadedDocs = deal.documentRequests.filter(
    (document) => document.status === DocumentStatus.UPLOADED,
  );
  const totalDocs = deal.documentRequests.length;
  const rawPercent =
    totalDocs > 0 ? Math.round((uploadedDocs.length / totalDocs) * 100) : 0;

  if (requestedDocs.length === 0 && uploadedDocs.length > 0) {
    return {
      status: StatusTrackerStatus.COMPLETE,
      notes: "All requested borrower docs are in and ready for the next handoff.",
      blockerReason: null,
      percentComplete: rawPercent || 100,
    };
  }

  if (requestedDocs.length > 0) {
    return {
      status:
        uploadedDocs.length > 0
          ? StatusTrackerStatus.IN_PROGRESS
          : StatusTrackerStatus.PENDING,
      notes: `${requestedDocs.length} borrower item${requestedDocs.length === 1 ? "" : "s"} still outstanding.`,
      blockerReason: `Waiting on ${requestedDocs[0].title}.`,
      percentComplete: rawPercent || 35,
    };
  }

  if (uploadedDocs.length > 0) {
    return {
      status: StatusTrackerStatus.IN_PROGRESS,
      notes: "Borrower has started sending the core package.",
      blockerReason: null,
      percentComplete: rawPercent || 65,
    };
  }

  return {
    status: StatusTrackerStatus.NOT_STARTED,
    notes: "Borrower collection has not started yet.",
    blockerReason: null,
    percentComplete: 0,
  };
}

function deriveLoSectionState(deal: DealTrackerContext) {
  const openTasks = deal.tasks.filter((task) => task.status === TaskStatus.OPEN);
  const completedTasks = deal.tasks.filter((task) => task.status === TaskStatus.DONE);
  const totalTasks = deal.tasks.length;
  const requestedDocs = deal.documentRequests.filter(
    (document) => document.status === DocumentStatus.REQUESTED,
  );
  const rawPercent =
    totalTasks > 0 ? Math.round((completedTasks.length / totalTasks) * 100) : 0;

  if (deal.stage === DealStage.CLOSING && openTasks.length === 0) {
    return {
      status: StatusTrackerStatus.COMPLETE,
      notes: "Internal review is complete and the file is moving through closing.",
      blockerReason: null,
      percentComplete: 100,
    };
  }

  if (requestedDocs.length > 0) {
    return {
      status: StatusTrackerStatus.PENDING,
      notes: "LO review is paused until the open borrower items come back.",
      blockerReason: `Waiting on ${requestedDocs[0].title}.`,
      percentComplete: rawPercent || 40,
    };
  }

  if (openTasks.length > 0 || deal.stage !== DealStage.LEAD) {
    return {
      status: StatusTrackerStatus.IN_PROGRESS,
      notes:
        openTasks.length > 0
          ? `Working through ${openTasks.length} live task${openTasks.length === 1 ? "" : "s"} on the file.`
          : "Deal is past intake and currently under operator review.",
      blockerReason: null,
      percentComplete: rawPercent || 65,
    };
  }

  return {
    status: StatusTrackerStatus.NOT_STARTED,
    notes: "LO review has not started yet.",
    blockerReason: null,
    percentComplete: 0,
  };
}

function deriveTitleSectionState(deal: DealTrackerContext) {
  const titleStatus = (deal.loanFile?.titleStatus ?? "").trim();
  const normalized = titleStatus.toLowerCase();

  if (matchesAny(normalized, ["clear", "complete", "received", "final"])) {
    return {
      status: StatusTrackerStatus.COMPLETE,
      notes: titleStatus || "Title work is complete for the current stage.",
      blockerReason: null,
      percentComplete: 100,
    };
  }

  if (matchesAny(normalized, ["wait", "await", "pending", "hold"])) {
    return {
      status: StatusTrackerStatus.PENDING,
      notes: titleStatus || "Title is waiting on outside input.",
      blockerReason: titleStatus || "Waiting on title company response.",
      percentComplete: 40,
    };
  }

  if (matchesAny(normalized, ["order", "search", "review", "progress"])) {
    return {
      status: StatusTrackerStatus.IN_PROGRESS,
      notes: titleStatus || "Title work is underway.",
      blockerReason: null,
      percentComplete: 65,
    };
  }

  return {
    status: StatusTrackerStatus.NOT_STARTED,
    notes: "Title has not started yet.",
    blockerReason: null,
    percentComplete: 0,
  };
}

function deriveLenderSectionState(deal: DealTrackerContext) {
  const submittedSources = deal.capitalSources.filter((source) =>
    ([CapitalSourceStatus.SUBMITTED, CapitalSourceStatus.QUOTE_RECEIVED] as CapitalSourceStatus[]).includes(source.status),
  );
  const targetedSources = deal.capitalSources.filter(
    (source) => source.status === CapitalSourceStatus.TARGETED,
  );
  const submissionStatus =
    deal.loanFile?.submissionStatus ?? SubmissionStatus.NOT_READY;

  if (
    deal.stage === DealStage.CLOSING &&
    (submittedSources.length > 0 || submissionStatus === SubmissionStatus.SUBMITTED)
  ) {
    return {
      status: StatusTrackerStatus.COMPLETE,
      notes: "Lender-side review is complete and the file is in closing motion.",
      blockerReason: null,
      percentComplete: 100,
    };
  }

  if (
    submittedSources.length > 0 ||
    submissionStatus === SubmissionStatus.SUBMITTED
  ) {
    return {
      status: StatusTrackerStatus.IN_PROGRESS,
      notes: `File is out with ${submittedSources[0]?.lenderName ?? "the lender"} for review.`,
      blockerReason: null,
      percentComplete: submittedSources.some(
        (source) => source.status === CapitalSourceStatus.QUOTE_RECEIVED,
      )
        ? 80
        : 65,
    };
  }

  if (
    targetedSources.length > 0 ||
    submissionStatus === SubmissionStatus.READY_TO_SUBMIT
  ) {
    return {
      status: StatusTrackerStatus.PENDING,
      notes: "Lender selection is lined up, but the file is not fully out yet.",
      blockerReason:
        submissionStatus === SubmissionStatus.READY_TO_SUBMIT
          ? "Waiting on operator submission."
          : "Waiting on lender handoff.",
      percentComplete: 35,
    };
  }

  return {
    status: StatusTrackerStatus.NOT_STARTED,
    notes: "File has not reached lender review yet.",
    blockerReason: null,
    percentComplete: 0,
  };
}

function deriveClosingSectionState(deal: DealTrackerContext) {
  const fundedAmount = Boolean(deal.loanFile?.fundedAmount?.trim());
  const firstPaymentDate = Boolean(deal.loanFile?.firstPaymentDate?.trim());
  const closingConditions = (deal.loanFile?.closingConditions ?? "").trim();
  const closingAttorney = (deal.loanFile?.closingAttorney ?? "").trim();

  if (fundedAmount || firstPaymentDate) {
    return {
      status: StatusTrackerStatus.COMPLETE,
      notes: "Closing is complete and the funded details are in the file.",
      blockerReason: null,
      percentComplete: 100,
    };
  }

  if (deal.stage === DealStage.CLOSING && (closingConditions || closingAttorney)) {
    return {
      status: StatusTrackerStatus.IN_PROGRESS,
      notes:
        closingConditions ||
        "Closing prep is active and final details are being coordinated.",
      blockerReason: null,
      percentComplete: 70,
    };
  }

  if (deal.stage === DealStage.CLOSING) {
    return {
      status: StatusTrackerStatus.PENDING,
      notes: "Closing is next, but the final package is not ready yet.",
      blockerReason: "Waiting on final approvals or scheduling.",
      percentComplete: 40,
    };
  }

  return {
    status: StatusTrackerStatus.NOT_STARTED,
    notes: "Closing prep has not started yet.",
    blockerReason: null,
    percentComplete: 0,
  };
}

function getDefaultDueDate(sectionKey: StatusTrackerSectionKey, targetCloseDate: Date) {
  return addDays(targetCloseDate, sectionConfig[sectionKey].dueOffsetDays);
}

function getDefaultPersonOrCompanyName({
  borrowerName,
  capitalSourceName,
  closingAttorney,
  sectionKey,
}: {
  borrowerName: string;
  capitalSourceName?: string | null;
  closingAttorney?: string | null;
  sectionKey: StatusTrackerSectionKey;
}) {
  switch (sectionKey) {
    case StatusTrackerSectionKey.BORROWER:
      return borrowerName;
    case StatusTrackerSectionKey.LO:
      return defaultLoOwner;
    case StatusTrackerSectionKey.TITLE:
      return "Unassigned";
    case StatusTrackerSectionKey.LENDER:
      return capitalSourceName || "Rehoboth Group";
    case StatusTrackerSectionKey.CLOSING:
      return closingAttorney || "Unassigned";
  }
}

function getDefaultAssignedToName(sectionKey: StatusTrackerSectionKey) {
  switch (sectionKey) {
    case StatusTrackerSectionKey.BORROWER:
      return "Borrower";
    case StatusTrackerSectionKey.LO:
      return defaultLoOwner;
    case StatusTrackerSectionKey.TITLE:
      return "Nora Wells";
    case StatusTrackerSectionKey.LENDER:
      return "Marcus Reed";
    case StatusTrackerSectionKey.CLOSING:
      return "Nora Wells";
  }
}

function getDefaultSectionNote(sectionKey: StatusTrackerSectionKey) {
  switch (sectionKey) {
    case StatusTrackerSectionKey.BORROWER:
      return "Waiting for borrower activity.";
    case StatusTrackerSectionKey.LO:
      return "No internal review started yet.";
    case StatusTrackerSectionKey.TITLE:
      return "No title activity yet.";
    case StatusTrackerSectionKey.LENDER:
      return "No lender submission yet.";
    case StatusTrackerSectionKey.CLOSING:
      return "No closing prep yet.";
  }
}

function getPercentCompleteForStatus(
  status: StatusTrackerStatus,
  rawPercent: number,
) {
  const normalized = Math.max(0, Math.min(rawPercent, 100));

  switch (status) {
    case StatusTrackerStatus.COMPLETE:
      return 100;
    case StatusTrackerStatus.NOT_STARTED:
      return 0;
    case StatusTrackerStatus.OVERDUE:
      return Math.max(20, Math.min(normalized || 35, 85));
    case StatusTrackerStatus.PENDING:
      return Math.max(25, Math.min(normalized || 40, 80));
    case StatusTrackerStatus.IN_PROGRESS:
      return Math.max(35, Math.min(normalized || 65, 90));
  }
}

function matchesAny(value: string, matches: string[]) {
  return matches.some((match) => value.includes(match));
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}
