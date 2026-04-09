import { getPrisma } from "./prisma";

export async function getRatesheetsPageData() {
  const prisma = getPrisma();

  const ratesheets = await prisma.lenderRatesheet.findMany({
    orderBy: [{ lenderName: "asc" }, { programName: "asc" }],
  });

  return {
    counts: {
      total: ratesheets.length,
      cre: ratesheets.filter((sheet) => sheet.dealTypes.includes("CRE")).length,
      residential: ratesheets.filter((sheet) =>
        sheet.dealTypes.includes("RESIDENTIAL"),
      ).length,
    },
    ratesheets,
  };
}
