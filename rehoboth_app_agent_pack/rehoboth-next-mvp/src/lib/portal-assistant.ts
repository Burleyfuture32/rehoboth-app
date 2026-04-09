export type PortalAssistantReply = {
  answer: string;
  routeHints?: Array<{
    href: string;
    label: string;
  }>;
};

const defaultReply: PortalAssistantReply = {
  answer:
    "I can help with document uploads, milestone status, portal navigation, and what to expect next on your file. Ask about uploads, status updates, or who to contact.",
  routeHints: [{ href: "/portal", label: "Portal home" }],
};

const knowledgeBase: Array<{
  match: string[];
  reply: PortalAssistantReply;
}> = [
  {
    match: ["upload", "document", "file", "submit"],
    reply: {
      answer:
        "Open the Outstanding Documents section on your portal page, choose the requested item, attach the file, and click Submit Document. Uploaded items then move into the Uploaded Documents list.",
    },
  },
  {
    match: ["status", "milestone", "progress", "checkpoint"],
    reply: {
      answer:
        "The Milestone Tracker shows each checkpoint for your file, who owns it, and whether it is pending, in progress, complete, or overdue. The progress number at the top is the overall file completion percentage.",
    },
  },
  {
    match: ["next", "what happens next", "what now", "timeline"],
    reply: {
      answer:
        "Use the What Happens Next card near the top of the portal. It is the plain-language next step for your file and updates as documents, review, underwriting, and closing milestones move forward.",
    },
  },
  {
    match: ["contact", "team", "who handles", "who owns"],
    reply: {
      answer:
        "The Rehoboth Team section shows who owns the current client-facing stages on your file. If a document request is unclear, contact that Rehoboth team member before uploading a replacement file.",
    },
  },
  {
    match: ["closing", "close", "funding"],
    reply: {
      answer:
        "Once the file reaches closing, the portal should show closing coordination updates and the next milestone. Rehoboth handles the lender, title, and final coordination side while you use the portal for visibility and requested uploads.",
    },
  },
  {
    match: ["portal", "home", "where do i start"],
    reply: {
      answer:
        "Start from Portal Home to open your file, then use the deal page for documents, milestones, recent updates, and team contacts.",
      routeHints: [{ href: "/portal", label: "Open portal home" }],
    },
  },
];

export const portalAssistantSuggestedQuestions = [
  "How do I upload a document?",
  "What does the milestone tracker mean?",
  "What happens next on my file?",
  "Who should I contact about an item?",
];

export function getPortalAssistantReply(question: string): PortalAssistantReply {
  const normalized = question.trim().toLowerCase();

  if (!normalized) {
    return defaultReply;
  }

  const matched = knowledgeBase.find((entry) =>
    entry.match.some((term) => normalized.includes(term)),
  );

  return matched?.reply ?? defaultReply;
}
