"use server";

import { randomUUID } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import {
  CapitalSourceStatus,
  CommunicationChannel,
  CommunicationDirection,
  DealStage,
  DealType,
  DocumentStatus,
  StatusTrackerStatus,
  SubmissionStatus,
  TaskPriority,
  TaskStatus,
} from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getPrisma } from "@/lib/prisma";
import {
  buildStatusTrackerSectionsForCreate,
  recalculateStatusTrackerForDeal,
} from "@/lib/status-tracker";
import { getWorkflowTemplate } from "@/lib/workflow-templates";

const stageOrder = [
  DealStage.LEAD,
  DealStage.NEW_FILE,
  DealStage.PROCESSING,
  DealStage.UNDERWRITING,
  DealStage.DOCS_REQUESTED,
  DealStage.CLOSING,
] as const;

const demoUploadRoot = path.join(process.cwd(), "public", "demo-uploads");

export async function createLeadAction(formData: FormData) {
  const prisma = getPrisma();

  const borrowerName = String(formData.get("borrowerName") ?? "").trim();
  const entityType = String(formData.get("entityType") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const dealName = String(formData.get("dealName") ?? "").trim();
  const dealTypeValue = String(formData.get("dealType") ?? "RESIDENTIAL");
  const program = String(formData.get("program") ?? "").trim();
  const propertyAddress = String(formData.get("propertyAddress") ?? "").trim();
  const market = String(formData.get("market") ?? "").trim();
  const occupancy = String(formData.get("occupancy") ?? "").trim();
  const source = String(formData.get("source") ?? "").trim();
  const summary = String(formData.get("notes") ?? "").trim();
  const loanAmount = Number(formData.get("loanAmount") ?? 0);
  const estimatedValue = Number(formData.get("estimatedValue") ?? 0);

  if (!borrowerName || !dealName || !propertyAddress) {
    redirect("/leads/intake?error=missing");
  }

  const dealType =
    dealTypeValue === "CRE" ? DealType.CRE : DealType.RESIDENTIAL;
  const ltv =
    estimatedValue > 0 ? Math.round((loanAmount / estimatedValue) * 100) : 70;
  const targetCloseDate = new Date(Date.now() + 45 * 24 * 60 * 60 * 1000);

  const borrower = await prisma.borrower.create({
    data: {
      name: borrowerName,
      entityType,
      email,
      phone,
      experience: "New lead intake",
      deals: {
        create: {
          name: dealName,
          dealType,
          stage: DealStage.LEAD,
          program,
          propertyAddress,
          market,
          occupancy,
          source,
          loanAmount,
          estimatedValue,
          ltv,
          summary,
          targetCloseDate,
          tasks: {
            create: [
              {
                title: "Review intake package",
                owner: "Avery Shaw",
                dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
                priority: TaskPriority.HIGH,
                category: "Intake",
              },
              {
                title: "Send starter document checklist",
                owner: "Nora Wells",
                dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
                priority: TaskPriority.MEDIUM,
                category: "Documents",
              },
            ],
          },
          documentRequests: {
            create: getStarterDocumentRequests(dealType),
          },
          loanFile: {
            create: getStarterLoanFile({
              borrowerLegalName: borrowerName,
              entityType,
              loanAmount,
              estimatedValue,
              occupancy,
              propertyAddress,
              source,
              targetCloseDate,
              dealType,
            }),
          },
          statusTrackerSections: {
            create: buildStatusTrackerSectionsForCreate({
              borrowerName,
              targetCloseDate,
            }),
          },
        },
      },
    },
    include: {
      deals: {
        take: 1,
      },
    },
  });

  const createdDeal = borrower.deals[0];

  await createDealActivity(getPrisma(), {
    dealId: createdDeal.id,
    title: "Lead created",
    body: `New ${dealType.toLowerCase()} deal created from intake for ${borrowerName}.`,
    createdBy: "System",
    kind: "SYSTEM",
  });

  await recalculateStatusTrackerForDeal(prisma, createdDeal.id, {
    actor: "System",
    logActivity: false,
  });

  revalidateDealPaths(createdDeal.id);
  redirect(`/pipeline?created=${createdDeal.id}`);
}

export async function advanceDealStageAction(formData: FormData) {
  const prisma = getPrisma();
  const dealId = String(formData.get("dealId") ?? "");

  const deal = await prisma.deal.findUnique({
    where: {
      id: dealId,
    },
    select: {
      id: true,
      stage: true,
    },
  });

  if (!deal) {
    return;
  }

  const currentIndex = stageOrder.indexOf(deal.stage);
  const nextStage =
    currentIndex >= 0 && currentIndex < stageOrder.length - 1
      ? stageOrder[currentIndex + 1]
      : deal.stage;

  if (nextStage !== deal.stage) {
    await prisma.deal.update({
      where: { id: deal.id },
      data: { stage: nextStage },
    });

    await createDealActivity(prisma, {
      dealId: deal.id,
      title: "Stage advanced",
      body: `Moved from ${deal.stage.replaceAll("_", " ")} to ${nextStage.replaceAll("_", " ")}.`,
      createdBy: "System",
      kind: "STAGE",
    });
  }

  await recalculateStatusTrackerForDeal(prisma, deal.id, {
    actor: "System",
    logActivity: true,
  });

  revalidateDealPaths(deal.id);
}

export async function completeTaskAction(formData: FormData) {
  const prisma = getPrisma();
  const taskId = String(formData.get("taskId") ?? "");

  if (!taskId) {
    return;
  }

  const task = await prisma.task.findUnique({
    where: {
      id: taskId,
    },
    select: {
      dealId: true,
      title: true,
    },
  });

  if (!task) {
    return;
  }

  const returnTo = getSafeReturnPath(
    formData.get("returnTo"),
    `/deals/${task.dealId}/file?taskDone=1`,
  );

  await prisma.task.update({
    where: {
      id: taskId,
    },
    data: {
      status: TaskStatus.DONE,
    },
  });

  await createDealActivity(prisma, {
    dealId: task.dealId,
    title: "Task completed",
    body: `Completed task: ${task.title}.`,
    createdBy: "System",
    kind: "TASK",
  });

  await recalculateStatusTrackerForDeal(prisma, task.dealId, {
    actor: "System",
    logActivity: true,
  });

  revalidateDealPaths(task.dealId);
  redirect(returnTo);
}

export async function createTaskAction(formData: FormData) {
  const prisma = getPrisma();
  const dealId = String(formData.get("dealId") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const owner = String(formData.get("owner") ?? "").trim();
  const category = String(formData.get("category") ?? "").trim();
  const dueDateValue = String(formData.get("dueDate") ?? "").trim();
  const priorityValue = String(formData.get("priority") ?? TaskPriority.MEDIUM);
  const returnTo = getSafeReturnPath(
    formData.get("returnTo"),
    `/deals/${dealId}/file?taskSaved=1`,
  );

  if (!dealId || !title || !owner || !category || !dueDateValue) {
    redirect(returnTo);
  }

  const dueDate = new Date(dueDateValue);

  if (Number.isNaN(dueDate.getTime())) {
    redirect(returnTo);
  }

  const priority = Object.values(TaskPriority).includes(priorityValue as TaskPriority)
    ? (priorityValue as TaskPriority)
    : TaskPriority.MEDIUM;

  await prisma.task.create({
    data: {
      dealId,
      title,
      owner,
      dueDate,
      priority,
      category,
      status: TaskStatus.OPEN,
    },
  });

  await createDealActivity(prisma, {
    dealId,
    title: "Task added",
    body: `Added task: ${title}.`,
    createdBy: owner,
    kind: "TASK",
  });

  await recalculateStatusTrackerForDeal(prisma, dealId, {
    actor: owner,
    logActivity: true,
  });

  revalidateDealPaths(dealId);
  redirect(returnTo);
}

export async function requestDocumentAction(formData: FormData) {
  const prisma = getPrisma();
  const dealId = String(formData.get("dealId") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const category = String(formData.get("category") ?? "").trim();
  const requestedBy = String(formData.get("requestedBy") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();
  const returnTo = getSafeReturnPath(
    formData.get("returnTo"),
    `/documents?dealId=${dealId}`,
  );

  if (!dealId || !title || !category || !requestedBy) {
    redirect(returnTo);
  }

  await prisma.documentRequest.create({
    data: {
      dealId,
      title,
      category,
      requestedBy,
      notes: notes || null,
      status: DocumentStatus.REQUESTED,
    },
  });

  await createDealActivity(prisma, {
    dealId,
    title: "Document requested",
    body: `Requested ${title}.`,
    createdBy: requestedBy,
    kind: "DOCUMENT",
  });

  await recalculateStatusTrackerForDeal(prisma, dealId, {
    actor: requestedBy,
    logActivity: true,
  });

  revalidateDealPaths(dealId);
  redirect(returnTo);
}

export async function uploadDocumentAction(formData: FormData) {
  const prisma = getPrisma();
  const documentRequestId = String(formData.get("documentRequestId") ?? "").trim();

  if (!documentRequestId) {
    return;
  }

  const documentRequest = await prisma.documentRequest.findUnique({
    where: {
      id: documentRequestId,
    },
    select: {
      id: true,
      dealId: true,
      title: true,
    },
  });

  if (!documentRequest) {
    return;
  }

  const returnTo = getSafeReturnPath(
    formData.get("returnTo"),
    `/documents?dealId=${documentRequest.dealId}`,
  );
  const file = formData.get("file");

  if (!(file instanceof File) || file.size === 0) {
    redirect(returnTo);
  }

  const safeOriginalName = sanitizeFileName(file.name || documentRequest.title);
  const uniqueFileName = `${Date.now()}-${randomUUID()}-${safeOriginalName}`;
  const dealDirectory = path.join(demoUploadRoot, documentRequest.dealId);

  await mkdir(dealDirectory, { recursive: true });
  await writeFile(
    path.join(dealDirectory, uniqueFileName),
    Buffer.from(await file.arrayBuffer()),
  );

  await prisma.documentRequest.update({
    where: {
      id: documentRequest.id,
    },
    data: {
      status: DocumentStatus.UPLOADED,
      uploadedFileName: file.name || safeOriginalName,
      uploadedFileUrl: `/demo-uploads/${documentRequest.dealId}/${uniqueFileName}`,
      uploadedAt: new Date(),
    },
  });

  await createDealActivity(prisma, {
    dealId: documentRequest.dealId,
    title: "Document uploaded",
    body: `Uploaded file for ${documentRequest.title}.`,
    createdBy: "System",
    kind: "DOCUMENT",
  });

  await recalculateStatusTrackerForDeal(prisma, documentRequest.dealId, {
    actor: "System",
    logActivity: true,
  });

  revalidateDealPaths(documentRequest.dealId);
  redirect(returnTo);
}

export async function saveLoanFileAction(formData: FormData) {
  const prisma = getPrisma();
  const dealId = String(formData.get("dealId") ?? "").trim();

  if (!dealId) {
    return;
  }

  const returnTo = getSafeReturnPath(
    formData.get("returnTo"),
    `/deals/${dealId}/file?saved=1`,
  );

  await prisma.loanFile.upsert({
    where: {
      dealId,
    },
    create: {
      dealId,
      ...getLoanFilePayload(formData),
    },
    update: getLoanFilePayload(formData),
  });

  await createDealActivity(prisma, {
    dealId,
    title: "Client file updated",
    body: "Updated the deep-dive client file fields.",
    createdBy: "System",
    kind: "NOTE",
  });

  await recalculateStatusTrackerForDeal(prisma, dealId, {
    actor: "System",
    logActivity: true,
  });

  revalidateDealPaths(dealId);
  redirect(returnTo);
}

export async function saveSubmissionSummaryAction(formData: FormData) {
  const prisma = getPrisma();
  const dealId = String(formData.get("dealId") ?? "").trim();

  if (!dealId) {
    return;
  }

  const returnTo = getSafeReturnPath(
    formData.get("returnTo"),
    `/deals/${dealId}/summary?saved=1`,
  );
  const submissionStatusValue = String(
    formData.get("submissionStatus") ?? SubmissionStatus.NOT_READY,
  );
  const submissionStatus = Object.values(SubmissionStatus).includes(
    submissionStatusValue as SubmissionStatus,
  )
    ? (submissionStatusValue as SubmissionStatus)
    : SubmissionStatus.NOT_READY;

  await prisma.loanFile.upsert({
    where: {
      dealId,
    },
    create: {
      dealId,
      submissionStatus,
      recommendedAction: getOptionalString(formData, "recommendedAction"),
      submissionNotes: getOptionalString(formData, "submissionNotes"),
      missingItemsSummary: getOptionalString(formData, "missingItemsSummary"),
    },
    update: {
      submissionStatus,
      recommendedAction: getOptionalString(formData, "recommendedAction"),
      submissionNotes: getOptionalString(formData, "submissionNotes"),
      missingItemsSummary: getOptionalString(formData, "missingItemsSummary"),
    },
  });

  await createDealActivity(prisma, {
    dealId,
    title: "Submission summary updated",
    body: `Submission status set to ${submissionStatus.replaceAll("_", " ")}.`,
    createdBy: "System",
    kind: "NOTE",
  });

  await recalculateStatusTrackerForDeal(prisma, dealId, {
    actor: "System",
    logActivity: true,
  });

  revalidateDealPaths(dealId);
  redirect(returnTo);
}

export async function addDealActivityAction(formData: FormData) {
  const prisma = getPrisma();
  const dealId = String(formData.get("dealId") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  const createdBy = String(formData.get("createdBy") ?? "").trim();

  if (!dealId || !title || !body || !createdBy) {
    return;
  }

  const returnTo = getSafeReturnPath(
    formData.get("returnTo"),
    `/deals/${dealId}/summary?activity=1`,
  );

  await prisma.dealActivity.create({
    data: {
      dealId,
      title,
      body,
      createdBy,
      kind: "NOTE",
    },
  });

  revalidatePath(`/deals/${dealId}`);
  revalidatePath(`/deals/${dealId}/summary`);
  redirect(returnTo);
}

export async function addCapitalSourceAction(formData: FormData) {
  const prisma = getPrisma();
  const dealId = String(formData.get("dealId") ?? "").trim();
  const lenderName = String(formData.get("lenderName") ?? "").trim();
  const program = String(formData.get("program") ?? "").trim();
  const statusValue = String(
    formData.get("status") ?? CapitalSourceStatus.TARGETED,
  );

  if (!dealId || !lenderName || !program) {
    return;
  }

  const status = Object.values(CapitalSourceStatus).includes(
    statusValue as CapitalSourceStatus,
  )
    ? (statusValue as CapitalSourceStatus)
    : CapitalSourceStatus.TARGETED;
  const returnTo = getSafeReturnPath(
    formData.get("returnTo"),
    `/deals/${dealId}/summary?capital=1`,
  );

  await prisma.capitalSourceMatch.create({
    data: {
      dealId,
      lenderName,
      program,
      status,
      quoteAmount: getOptionalString(formData, "quoteAmount"),
      leverage: getOptionalString(formData, "leverage"),
      rate: getOptionalString(formData, "rate"),
      notes: getOptionalString(formData, "notes"),
    },
  });

  await createDealActivity(prisma, {
    dealId,
    title: "Capital source added",
    body: `Added ${lenderName} for ${program} with status ${status.replaceAll("_", " ")}.`,
    createdBy: "System",
    kind: "LENDER",
  });

  await recalculateStatusTrackerForDeal(prisma, dealId, {
    actor: "System",
    logActivity: true,
  });

  revalidateDealPaths(dealId);
  revalidatePath("/capital-sources");
  revalidatePath("/reports");
  redirect(returnTo);
}

export async function addCommunicationAction(formData: FormData) {
  const prisma = getPrisma();
  const dealId = String(formData.get("dealId") ?? "").trim();
  const createdBy = String(formData.get("createdBy") ?? "").trim();
  const message = String(formData.get("message") ?? "").trim();

  if (!dealId || !createdBy || !message) {
    return;
  }

  const channelValue = String(
    formData.get("channel") ?? CommunicationChannel.EMAIL,
  );
  const directionValue = String(
    formData.get("direction") ?? CommunicationDirection.OUTBOUND,
  );
  const channel = Object.values(CommunicationChannel).includes(
    channelValue as CommunicationChannel,
  )
    ? (channelValue as CommunicationChannel)
    : CommunicationChannel.EMAIL;
  const direction = Object.values(CommunicationDirection).includes(
    directionValue as CommunicationDirection,
  )
    ? (directionValue as CommunicationDirection)
    : CommunicationDirection.OUTBOUND;
  const returnTo = getSafeReturnPath(
    formData.get("returnTo"),
    `/deals/${dealId}/communications?logged=1`,
  );

  await prisma.communicationLog.create({
    data: {
      dealId,
      channel,
      direction,
      contactName: getOptionalString(formData, "contactName"),
      contactValue: getOptionalString(formData, "contactValue"),
      subject: getOptionalString(formData, "subject"),
      message,
      outcome: getOptionalString(formData, "outcome"),
      createdBy,
    },
  });

  await createDealActivity(prisma, {
    dealId,
    title: `${channel.replaceAll("_", " ")} logged`,
    body: `${direction.replaceAll("_", " ").toLowerCase()} ${channel.replaceAll("_", " ").toLowerCase()} saved in the client communications timeline.`,
    createdBy,
    kind: "COMMUNICATION",
  });

  revalidateDealPaths(dealId);
  redirect(returnTo);
}

export async function addWorkflowTemplateAction(formData: FormData) {
  const prisma = getPrisma();
  const dealId = String(formData.get("dealId") ?? "").trim();
  const workflowKey = String(formData.get("workflowKey") ?? "").trim();
  const createdBy = String(formData.get("createdBy") ?? "System").trim();

  if (!dealId || !workflowKey) {
    return;
  }

  const template = getWorkflowTemplate(workflowKey);

  if (!template) {
    return;
  }

  const deal = await prisma.deal.findUnique({
    where: {
      id: dealId,
    },
    include: {
      borrower: true,
      tasks: {
        select: {
          title: true,
        },
      },
      documentRequests: {
        select: {
          title: true,
        },
      },
    },
  });

  if (!deal) {
    return;
  }

  if (template.dealTypes && !template.dealTypes.includes(deal.dealType)) {
    redirect(
      getSafeReturnPath(
        formData.get("returnTo"),
        `/workflows?dealId=${dealId}&added=0`,
      ),
    );
  }

  const returnTo = getSafeReturnPath(
    formData.get("returnTo"),
    `/workflows?dealId=${dealId}&added=${workflowKey}`,
  );
  const existingTaskTitles = new Set(deal.tasks.map((task) => task.title));
  const existingDocumentTitles = new Set(
    deal.documentRequests.map((document) => document.title),
  );

  const taskCreates = template.tasks
    .filter((task) => !existingTaskTitles.has(task.title))
    .map((task) =>
      prisma.task.create({
        data: {
          dealId,
          title: task.title,
          owner: task.owner,
          dueDate: addDays(new Date(), task.dueOffsetDays),
          priority: task.priority,
          category: task.category,
        },
      }),
    );

  const documentCreates = template.documents
    .filter((document) => !existingDocumentTitles.has(document.title))
    .map((document) =>
      prisma.documentRequest.create({
        data: {
          dealId,
          title: document.title,
          category: document.category,
          requestedBy: document.requestedBy,
          notes: document.notes,
          status: DocumentStatus.REQUESTED,
        },
      }),
    );

  if (taskCreates.length || documentCreates.length) {
    await prisma.$transaction([...taskCreates, ...documentCreates]);
  }

  const createdTaskCount = taskCreates.length;
  const createdDocumentCount = documentCreates.length;

  await createDealActivity(prisma, {
    dealId,
    title: "Workflow added",
    body: `${template.title} launched for ${deal.borrower.name}. Added ${createdTaskCount} task${createdTaskCount === 1 ? "" : "s"} and ${createdDocumentCount} document request${createdDocumentCount === 1 ? "" : "s"}.`,
    createdBy,
    kind: "WORKFLOW",
  });

  revalidatePath("/workflows");
  revalidateDealPaths(dealId);
  redirect(returnTo);
}

export async function updateCapitalSourceAction(formData: FormData) {
  const prisma = getPrisma();
  const matchId = String(formData.get("matchId") ?? "").trim();

  if (!matchId) {
    return;
  }

  const match = await prisma.capitalSourceMatch.findUnique({
    where: {
      id: matchId,
    },
    select: {
      id: true,
      dealId: true,
      lenderName: true,
      status: true,
    },
  });

  if (!match) {
    return;
  }

  const statusValue = String(formData.get("status") ?? match.status);
  const status = Object.values(CapitalSourceStatus).includes(
    statusValue as CapitalSourceStatus,
  )
    ? (statusValue as CapitalSourceStatus)
    : match.status;
  const returnTo = getSafeReturnPath(
    formData.get("returnTo"),
    `/deals/${match.dealId}/summary?capital=1`,
  );

  await prisma.capitalSourceMatch.update({
    where: {
      id: match.id,
    },
    data: {
      status,
      quoteAmount: getOptionalString(formData, "quoteAmount"),
      leverage: getOptionalString(formData, "leverage"),
      rate: getOptionalString(formData, "rate"),
      notes: getOptionalString(formData, "notes"),
    },
  });

  await createDealActivity(prisma, {
    dealId: match.dealId,
    title: "Capital source updated",
    body: `${match.lenderName} status updated to ${status.replaceAll("_", " ")}.`,
    createdBy: "System",
    kind: "LENDER",
  });

  await recalculateStatusTrackerForDeal(prisma, match.dealId, {
    actor: "System",
    logActivity: true,
  });

  revalidateDealPaths(match.dealId);
  revalidatePath("/capital-sources");
  revalidatePath("/reports");
  redirect(returnTo);
}

export async function saveStatusTrackerSectionAction(formData: FormData) {
  const prisma = getPrisma();
  const dealId = String(formData.get("dealId") ?? "").trim();
  const sectionId = String(formData.get("sectionId") ?? "").trim();
  const updatedByName = String(formData.get("updatedByName") ?? "").trim();
  const overrideReason = String(formData.get("overrideReason") ?? "").trim();
  const returnTo = getSafeReturnPath(
    formData.get("returnTo"),
    `/deals/${dealId}/status-tracker?saved=1`,
  );

  if (!dealId || !sectionId || !updatedByName || !overrideReason) {
    redirect(returnTo);
  }

  const section = await prisma.statusTrackerSection.findUnique({
    where: {
      id: sectionId,
    },
    select: {
      id: true,
      dealId: true,
      sectionKey: true,
    },
  });

  if (!section || section.dealId !== dealId) {
    redirect(returnTo);
  }

  const requestedStatus = String(
    formData.get("status") ?? StatusTrackerStatus.NOT_STARTED,
  );
  const status = Object.values(StatusTrackerStatus).includes(
    requestedStatus as StatusTrackerStatus,
  )
    ? (requestedStatus as StatusTrackerStatus)
    : StatusTrackerStatus.NOT_STARTED;

  await prisma.statusTrackerSection.update({
    where: {
      id: section.id,
    },
    data: {
      personOrCompanyName: getOptionalString(formData, "personOrCompanyName"),
      assignedToName: getOptionalString(formData, "assignedToName"),
      status,
      notes: getOptionalString(formData, "notes"),
      dueDate: getOptionalDate(formData, "dueDate"),
      blockerReason: getOptionalString(formData, "blockerReason"),
      percentComplete: getPercentCompleteFromStatus(status),
      isBlocked: Boolean(getOptionalString(formData, "blockerReason")),
      isOverdue: false,
      manualOverride: true,
      manualOverrideReason: overrideReason,
      updatedByName,
    },
  });

  await recalculateStatusTrackerForDeal(prisma, dealId, {
    actor: updatedByName,
    logActivity: false,
  });

  await createDealActivity(prisma, {
    dealId,
    title: "Status tracker updated",
    body: `${section.sectionKey.replaceAll("_", " ")} manually updated to ${status.replaceAll("_", " ").toLowerCase()}. Reason: ${overrideReason}`,
    createdBy: updatedByName,
    kind: "STATUS_TRACKER",
  });

  revalidateDealPaths(dealId);
  redirect(returnTo);
}

export async function resetStatusTrackerSectionAction(formData: FormData) {
  const prisma = getPrisma();
  const dealId = String(formData.get("dealId") ?? "").trim();
  const sectionId = String(formData.get("sectionId") ?? "").trim();
  const updatedByName = String(formData.get("updatedByName") ?? "System").trim();
  const returnTo = getSafeReturnPath(
    formData.get("returnTo"),
    `/deals/${dealId}/status-tracker?saved=1`,
  );

  if (!dealId || !sectionId) {
    redirect(returnTo);
  }

  const section = await prisma.statusTrackerSection.findUnique({
    where: {
      id: sectionId,
    },
    select: {
      id: true,
      dealId: true,
      sectionKey: true,
    },
  });

  if (!section || section.dealId !== dealId) {
    redirect(returnTo);
  }

  await prisma.statusTrackerSection.update({
    where: {
      id: section.id,
    },
    data: {
      manualOverride: false,
      manualOverrideReason: null,
      updatedByName,
    },
  });

  await recalculateStatusTrackerForDeal(prisma, dealId, {
    actor: updatedByName,
    logActivity: true,
  });

  await createDealActivity(prisma, {
    dealId,
    title: "Status tracker reset",
    body: `${section.sectionKey.replaceAll("_", " ")} returned to automatic status rules.`,
    createdBy: updatedByName,
    kind: "STATUS_TRACKER",
  });

  revalidateDealPaths(dealId);
  redirect(returnTo);
}

export async function recalculateStatusTrackerAction(formData: FormData) {
  const prisma = getPrisma();
  const dealId = String(formData.get("dealId") ?? "").trim();
  const updatedByName = String(formData.get("updatedByName") ?? "System").trim();
  const returnTo = getSafeReturnPath(
    formData.get("returnTo"),
    `/deals/${dealId}/status-tracker?saved=1`,
  );

  if (!dealId) {
    redirect(returnTo);
  }

  await recalculateStatusTrackerForDeal(prisma, dealId, {
    actor: updatedByName,
    logActivity: true,
  });

  revalidateDealPaths(dealId);
  redirect(returnTo);
}

function getStarterDocumentRequests(dealType: DealType) {
  if (dealType === DealType.CRE) {
    return [
      {
        title: "Current entity formation documents",
        category: "Entity",
        requestedBy: "Nora Wells",
        notes: "Upload articles, operating agreement, and good standing if available.",
      },
      {
        title: "Most recent business bank statements",
        category: "Financials",
        requestedBy: "Marcus Reed",
        notes: "Start with the last two full months for demo underwriting.",
      },
      {
        title: "Property overview or rent roll",
        category: "Property",
        requestedBy: "Avery Shaw",
        notes: "Any current summary that explains occupancy and income is enough for MVP.",
      },
    ];
  }

  return [
    {
      title: "Signed loan application",
      category: "Application",
      requestedBy: "Avery Shaw",
      notes: "Upload the latest residential application package.",
    },
    {
      title: "Most recent bank statements",
      category: "Assets",
      requestedBy: "Marcus Reed",
      notes: "Need the most recent statements showing funds to close.",
    },
    {
      title: "Photo ID and credit authorization",
      category: "Identity",
      requestedBy: "Nora Wells",
      notes: "One clear identity document is enough for the investor demo flow.",
    },
  ];
}

function getSafeReturnPath(value: FormDataEntryValue | null, fallback: string) {
  if (typeof value !== "string" || !value.startsWith("/")) {
    return fallback;
  }

  return value;
}

function revalidateDealPaths(dealId: string) {
  revalidatePath("/");
  revalidatePath("/bulk-actions");
  revalidatePath("/portal");
  revalidatePath("/pipeline");
  revalidatePath("/tasks");
  revalidatePath("/documents");
  revalidatePath(`/deals/${dealId}`);
  revalidatePath(`/portal/${dealId}`);
  revalidatePath(`/deals/${dealId}/communications`);
  revalidatePath(`/deals/${dealId}/file`);
  revalidatePath(`/deals/${dealId}/summary`);
  revalidatePath(`/deals/${dealId}/status-tracker`);
}

function sanitizeFileName(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9.-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function getStarterLoanFile({
  borrowerLegalName,
  dealType,
  entityType,
  estimatedValue,
  loanAmount,
  occupancy,
  propertyAddress,
  source,
  targetCloseDate,
}: {
  borrowerLegalName: string;
  dealType: DealType;
  entityType: string;
  estimatedValue: number;
  loanAmount: number;
  occupancy: string;
  propertyAddress: string;
  source: string;
  targetCloseDate: Date;
}) {
  return {
    borrowerLegalName,
    entityLegalName: entityType === "LLC" ? borrowerLegalName : "",
    referralSource: source,
    loanPurpose: dealType === DealType.CRE ? "Acquisition / refinance" : "Purchase",
    requestedLoanAmount: loanAmount ? `${loanAmount}` : "",
    estimatedValue: estimatedValue ? `${estimatedValue}` : "",
    occupancyPlan: occupancy,
    propertyType: dealType === DealType.CRE ? "Commercial property" : "Residential home",
    titleStatus: "Not ordered",
    appraisalStatus: "Not ordered",
    insuranceStatus: "Pending quote",
    floodZoneStatus: "To be confirmed",
    targetClosingDate: targetCloseDate.toISOString().slice(0, 10),
    relationshipNotes: `Created from new lead intake for ${propertyAddress}.`,
  };
}

function getLoanFilePayload(formData: FormData) {
  return {
    borrowerLegalName: getOptionalString(formData, "borrowerLegalName"),
    borrowerTaxId: getOptionalString(formData, "borrowerTaxId"),
    borrowerDob: getOptionalString(formData, "borrowerDob"),
    coBorrowerName: getOptionalString(formData, "coBorrowerName"),
    coBorrowerCreditScore: getOptionalString(formData, "coBorrowerCreditScore"),
    entityLegalName: getOptionalString(formData, "entityLegalName"),
    entityState: getOptionalString(formData, "entityState"),
    guarantors: getOptionalString(formData, "guarantors"),
    referralSource: getOptionalString(formData, "referralSource"),
    loanPurpose: getOptionalString(formData, "loanPurpose"),
    requestedLoanAmount: getOptionalString(formData, "requestedLoanAmount"),
    purchasePrice: getOptionalString(formData, "purchasePrice"),
    estimatedValue: getOptionalString(formData, "estimatedValue"),
    cashToClose: getOptionalString(formData, "cashToClose"),
    termMonths: getOptionalString(formData, "termMonths"),
    amortizationMonths: getOptionalString(formData, "amortizationMonths"),
    ratePreference: getOptionalString(formData, "ratePreference"),
    propertyType: getOptionalString(formData, "propertyType"),
    occupancyPlan: getOptionalString(formData, "occupancyPlan"),
    unitCount: getOptionalString(formData, "unitCount"),
    yearBuilt: getOptionalString(formData, "yearBuilt"),
    titleStatus: getOptionalString(formData, "titleStatus"),
    appraisalStatus: getOptionalString(formData, "appraisalStatus"),
    insuranceStatus: getOptionalString(formData, "insuranceStatus"),
    floodZoneStatus: getOptionalString(formData, "floodZoneStatus"),
    monthlyIncome: getOptionalString(formData, "monthlyIncome"),
    monthlyDebt: getOptionalString(formData, "monthlyDebt"),
    liquidAssets: getOptionalString(formData, "liquidAssets"),
    reservesOnHand: getOptionalString(formData, "reservesOnHand"),
    noi: getOptionalString(formData, "noi"),
    dscr: getOptionalString(formData, "dscr"),
    creditScore: getOptionalString(formData, "creditScore"),
    dti: getOptionalString(formData, "dti"),
    backgroundSummary: getOptionalString(formData, "backgroundSummary"),
    conditionsSummary: getOptionalString(formData, "conditionsSummary"),
    missingItemsSummary: getOptionalString(formData, "missingItemsSummary"),
    processorNotes: getOptionalString(formData, "processorNotes"),
    underwritingNotes: getOptionalString(formData, "underwritingNotes"),
    closingAttorney: getOptionalString(formData, "closingAttorney"),
    closingConditions: getOptionalString(formData, "closingConditions"),
    targetClosingDate: getOptionalString(formData, "targetClosingDate"),
    fundedAmount: getOptionalString(formData, "fundedAmount"),
    firstPaymentDate: getOptionalString(formData, "firstPaymentDate"),
    exitStrategy: getOptionalString(formData, "exitStrategy"),
    relationshipNotes: getOptionalString(formData, "relationshipNotes"),
  };
}

function getOptionalString(formData: FormData, key: string) {
  const value = formData.get(key);

  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function getOptionalDate(formData: FormData, key: string) {
  const value = getOptionalString(formData, key);

  if (!value) {
    return null;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function getPercentCompleteFromStatus(status: StatusTrackerStatus) {
  switch (status) {
    case StatusTrackerStatus.COMPLETE:
      return 100;
    case StatusTrackerStatus.IN_PROGRESS:
      return 65;
    case StatusTrackerStatus.PENDING:
      return 40;
    case StatusTrackerStatus.OVERDUE:
      return 30;
    default:
      return 0;
  }
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

async function createDealActivity(
  prisma: ReturnType<typeof getPrisma>,
  {
    dealId,
    title,
    body,
    createdBy,
    kind,
  }: {
    dealId: string;
    title: string;
    body: string;
    createdBy: string;
    kind: string;
  },
) {
  await prisma.dealActivity.create({
    data: {
      dealId,
      title,
      body,
      createdBy,
      kind,
    },
  });
}
