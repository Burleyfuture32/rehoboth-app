import { DealType, TaskPriority } from "@prisma/client";

type WorkflowTemplate = {
  key: string;
  title: string;
  description: string;
  recommendedFor: string;
  dealTypes?: DealType[];
  tasks: Array<{
    title: string;
    owner: string;
    priority: TaskPriority;
    category: string;
    dueOffsetDays: number;
  }>;
  documents: Array<{
    title: string;
    category: string;
    requestedBy: string;
    notes: string;
  }>;
};

export const workflowTemplates: WorkflowTemplate[] = [
  {
    key: "borrower-follow-up",
    title: "Borrower follow-up sprint",
    description:
      "Creates the immediate task and communication reminders needed to pull a borrower file forward quickly.",
    recommendedFor: "Any live file that is waiting on borrower movement.",
    tasks: [
      {
        title: "Call borrower with clear next-step checklist",
        owner: "Marcus Reed",
        priority: TaskPriority.HIGH,
        category: "Borrower Follow-Up",
        dueOffsetDays: 1,
      },
      {
        title: "Send borrower follow-up summary by email or text",
        owner: "Nora Wells",
        priority: TaskPriority.MEDIUM,
        category: "Borrower Follow-Up",
        dueOffsetDays: 1,
      },
    ],
    documents: [],
  },
  {
    key: "residential-kickoff",
    title: "Residential kickoff",
    description:
      "Creates the basic residential processing checklist for a new or early-stage home loan file.",
    recommendedFor: "Residential files in Lead, New File, or Processing.",
    tasks: [
      {
        title: "Run residential income and asset review",
        owner: "Avery Shaw",
        priority: TaskPriority.HIGH,
        category: "Residential Processing",
        dueOffsetDays: 2,
      },
      {
        title: "Order title and homeowner insurance follow-up",
        owner: "Nora Wells",
        priority: TaskPriority.MEDIUM,
        category: "Residential Processing",
        dueOffsetDays: 2,
      },
    ],
    documents: [
      {
        title: "Most recent paystubs or income proof",
        category: "Income",
        requestedBy: "Avery Shaw",
        notes: "Need the newest borrower income support for the file.",
      },
      {
        title: "Homeowner insurance quote",
        category: "Insurance",
        requestedBy: "Nora Wells",
        notes: "Need the current quote before final submission.",
      },
    ],
    dealTypes: [DealType.RESIDENTIAL],
  },
  {
    key: "cre-underwriting-push",
    title: "CRE underwriting push",
    description:
      "Adds the underwriting and lender-readiness tasks that usually slow down a CRE file.",
    recommendedFor: "Commercial files moving into underwriting or lender handoff.",
    tasks: [
      {
        title: "Refresh sponsor liquidity and reserve review",
        owner: "Marcus Reed",
        priority: TaskPriority.HIGH,
        category: "CRE Underwriting",
        dueOffsetDays: 2,
      },
      {
        title: "Update lender-ready executive summary",
        owner: "Avery Shaw",
        priority: TaskPriority.MEDIUM,
        category: "CRE Underwriting",
        dueOffsetDays: 2,
      },
    ],
    documents: [
      {
        title: "Updated trailing twelve month operating statement",
        category: "Financials",
        requestedBy: "Marcus Reed",
        notes: "Need a refreshed operating snapshot for lender handoff.",
      },
      {
        title: "Current rent roll or occupancy summary",
        category: "Property",
        requestedBy: "Avery Shaw",
        notes: "Need a current occupancy picture for underwriting.",
      },
    ],
    dealTypes: [DealType.CRE],
  },
  {
    key: "closing-readiness",
    title: "Closing readiness",
    description:
      "Builds the final coordination checklist for files that are nearly ready to close.",
    recommendedFor: "Any file entering docs requested or closing.",
    tasks: [
      {
        title: "Confirm final closing package and signing timeline",
        owner: "Nora Wells",
        priority: TaskPriority.HIGH,
        category: "Closing",
        dueOffsetDays: 1,
      },
      {
        title: "Verify funding conditions and wire instructions",
        owner: "Marcus Reed",
        priority: TaskPriority.MEDIUM,
        category: "Closing",
        dueOffsetDays: 1,
      },
    ],
    documents: [
      {
        title: "Final closing package or settlement statement",
        category: "Closing",
        requestedBy: "Nora Wells",
        notes: "Need the final close package in the file.",
      },
    ],
  },
] as const;

export type WorkflowTemplateKey = (typeof workflowTemplates)[number]["key"];

export function getWorkflowTemplate(key: string) {
  return workflowTemplates.find((template) => template.key === key) ?? null;
}
