export type ExpertRouteHint = {
  href: string;
  label: string;
};

export type ExpertReply = {
  answer: string;
  routeHints?: ExpertRouteHint[];
};

const defaultReply: ExpertReply = {
  answer:
    "I can help with the Rehoboth workflow, client files, communications, documents, lender matching, ratesheets, and where to go next in the app. Try asking about a stage, a screen, or what to do next on a file.",
  routeHints: [
    { href: "/pipeline", label: "Pipeline board" },
    { href: "/tasks", label: "Task center" },
    { href: "/documents", label: "Documents" },
  ],
};

const knowledgeBase: Array<{
  match: string[];
  reply: ExpertReply;
}> = [
  {
    match: ["dashboard", "home", "overview"],
    reply: {
      answer:
        "Use the dashboard for the investor walkthrough and the fastest entry into the main flows. It is best for showing the overall business, not for working one file deeply.",
      routeHints: [{ href: "/", label: "Open dashboard" }],
    },
  },
  {
    match: ["lead", "intake", "new lead"],
    reply: {
      answer:
        "Lead Intake is where a new borrower or deal starts. Enter the borrower basics, deal type, property, and loan amount, and the app creates the starter tasks, client file, and document checklist for the new file.",
      routeHints: [{ href: "/leads/intake", label: "Open lead intake" }],
    },
  },
  {
    match: ["pipeline", "stage", "board", "processing", "underwriting", "closing"],
    reply: {
      answer:
        "The pipeline board shows each deal by stage. Stages move from Lead to New File to Processing to Underwriting to Docs Requested to Closing. Open a workspace from there when you need to work one client in detail.",
      routeHints: [{ href: "/pipeline", label: "Open pipeline" }],
    },
  },
  {
    match: ["task", "tasks", "follow up", "follow-up"],
    reply: {
      answer:
        "The Task Center shows what is still open across files. Inside a specific deal workspace, tasks answer the next immediate step for that client.",
      routeHints: [{ href: "/tasks", label: "Open task center" }],
    },
  },
  {
    match: ["workflow", "workflows", "template", "launcher"],
    reply: {
      answer:
        "Workflows is the quick-add section for repeating operating motions. Choose a file, launch a template, and the app creates the matching tasks and document requests without making you build them one by one.",
      routeHints: [{ href: "/workflows", label: "Open workflows" }],
    },
  },
  {
    match: ["bulk", "batch", "queues", "queue"],
    reply: {
      answer:
        "Bulk Actions is the grouped-work screen. Use it when you want to clear document follow-ups, near-term tasks, lender nudges, or submission-ready files from one place.",
      routeHints: [{ href: "/bulk-actions", label: "Open bulk actions" }],
    },
  },
  {
    match: ["document", "upload", "checklist", "requested docs"],
    reply: {
      answer:
        "Documents is the file collection area. You can request a document, upload a document, and see what is still outstanding. On a single file, the document section stays tied to the borrower workspace.",
      routeHints: [{ href: "/documents", label: "Open documents" }],
    },
  },
  {
    match: ["client file", "full file", "borrower workspace", "workspace"],
    reply: {
      answer:
        "The workspace is the operator screen for one deal. The Client File is the deep-dive record with borrower, property, financial, underwriting, and closing fields. Use the status bar at the top to see progress and the next step.",
      routeHints: [{ href: "/pipeline", label: "Start from pipeline" }],
    },
  },
  {
    match: ["communication", "crm", "email", "text", "call", "contact"],
    reply: {
      answer:
        "Communications is the CRM-style screen for one file. It lets you log email, text, and call activity in one place and keeps a running timeline so the next person knows exactly what happened with the client.",
      routeHints: [{ href: "/pipeline", label: "Open a deal from pipeline" }],
    },
  },
  {
    match: ["capital", "lender", "lenders", "match", "source"],
    reply: {
      answer:
        "Capital Sources tracks lender outreach on a live file. Use it when you need to see which lender was targeted, submitted, quoted, or passed, and update the status as the file moves.",
      routeHints: [{ href: "/capital-sources", label: "Open capital sources" }],
    },
  },
  {
    match: ["ratesheet", "ratesheets", "rate sheet", "pricing"],
    reply: {
      answer:
        "Ratesheets is the lender directory. It shows lender appetite, leverage, rough pricing, and contact info so you can compare options before updating a live capital-source record.",
      routeHints: [{ href: "/ratesheets", label: "Open ratesheets" }],
    },
  },
  {
    match: ["readiness", "submission", "submit", "handoff"],
    reply: {
      answer:
        "Submission Summary is the lender handoff screen. It combines open tasks, requested documents, capital-source motion, and manual notes to tell you whether the file is ready to submit or already out with lenders.",
      routeHints: [{ href: "/reports", label: "Open reports" }],
    },
  },
  {
    match: ["report", "reports", "metrics"],
    reply: {
      answer:
        "Reports is the simple top-level investor-demo view for activity and portfolio-level readouts. It is useful for presentation, while the workspace and communications page are better for day-to-day operator use.",
      routeHints: [{ href: "/reports", label: "Open reports" }],
    },
  },
];

export const expertSuggestedQuestions = [
  "Where should I start a new client?",
  "Where do I handle bulk follow-up work?",
  "What does the communications page do?",
  "How do I know if a file is ready to submit?",
  "Where do I compare lender pricing?",
];

export function getExpertReply(question: string): ExpertReply {
  const normalized = question.trim().toLowerCase();

  if (!normalized) {
    return defaultReply;
  }

  const matched = knowledgeBase.find((entry) =>
    entry.match.some((term) => normalized.includes(term)),
  );

  return matched?.reply ?? defaultReply;
}
