import { getPrisma } from "./prisma";

const shortcutResults = [
  {
    href: "/pipeline",
    label: "Pipeline Board",
    category: "Section",
    description: "See every live file by stage.",
    keywords: ["pipeline", "board", "stage", "deal board"],
  },
  {
    href: "/tasks",
    label: "Task Center",
    category: "Section",
    description: "See open and completed tasks across files.",
    keywords: ["tasks", "task center", "follow up", "todo"],
  },
  {
    href: "/workflows",
    label: "Workflows",
    category: "Section",
    description: "Launch repeatable workflow templates quickly.",
    keywords: ["workflow", "workflow launcher", "template", "automation"],
  },
  {
    href: "/documents",
    label: "Documents",
    category: "Section",
    description: "Request and upload files tied to each deal.",
    keywords: ["documents", "uploads", "checklist", "requested docs"],
  },
  {
    href: "/capital-sources",
    label: "Capital Sources",
    category: "Section",
    description: "Track lender outreach and current statuses.",
    keywords: ["capital", "lenders", "sources", "lender status"],
  },
  {
    href: "/ratesheets",
    label: "Ratesheets",
    category: "Section",
    description: "Compare lender pricing and program fit.",
    keywords: ["ratesheets", "pricing", "rate sheet", "lender pricing"],
  },
  {
    href: "/scenarios",
    label: "Scenarios Desk",
    category: "Section",
    description: "Run side-by-side lender comparisons for one scenario.",
    keywords: ["scenario", "scenarios", "compare lenders", "lender comparison"],
  },
  {
    href: "/reports",
    label: "Reports",
    category: "Section",
    description: "High-level investor-demo reporting view.",
    keywords: ["reports", "metrics", "investor"],
  },
];

export async function getSearchResults(query: string) {
  const prisma = getPrisma();
  const normalized = query.trim().toLowerCase();

  if (!normalized) {
    return {
      deals: [],
      shortcuts: shortcutResults.slice(0, 4),
    };
  }

  const deals = await prisma.deal.findMany({
    where: {
      OR: [
        { name: { contains: query } },
        { program: { contains: query } },
        { market: { contains: query } },
        { propertyAddress: { contains: query } },
        { source: { contains: query } },
        {
          borrower: {
            is: {
              name: { contains: query },
            },
          },
        },
      ],
    },
    include: {
      borrower: true,
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 8,
  });

  const shortcuts = shortcutResults.filter(
    (shortcut) =>
      shortcut.label.toLowerCase().includes(normalized) ||
      shortcut.description.toLowerCase().includes(normalized) ||
      shortcut.keywords.some((keyword) => keyword.includes(normalized)),
  );

  return {
    deals,
    shortcuts,
  };
}
