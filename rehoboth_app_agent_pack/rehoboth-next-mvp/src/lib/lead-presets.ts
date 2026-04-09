export type LeadPreset = {
  borrowerName: string;
  entityType: string;
  email: string;
  phone: string;
  dealName: string;
  dealType: "RESIDENTIAL" | "CRE";
  program: string;
  propertyAddress: string;
  market: string;
  occupancy: string;
  loanAmount: number;
  estimatedValue: number;
  source: string;
  notes: string;
};

export const leadPresets: Record<"residential" | "cre", LeadPreset> = {
  residential: {
    borrowerName: "Tim Webb",
    entityType: "Individual",
    email: "tim.webb@example.com",
    phone: "(404) 555-0172",
    dealName: "Tim Webb Home Loan",
    dealType: "RESIDENTIAL",
    program: "Residential Purchase",
    propertyAddress: "Atlanta Metro Home Purchase",
    market: "Atlanta, GA",
    occupancy: "Primary residence",
    loanAmount: 328000,
    estimatedValue: 410000,
    source: "Existing client file",
    notes:
      "Pattern based on the Tim Webb file set: 1003 URLA, IDIQ credit reports, USAA checking statements, transfer receipts, and a personal financial statement.",
  },
  cre: {
    borrowerName: "Bean Barn Properties LLC",
    entityType: "LLC",
    email: "nashlie.sephus@example.com",
    phone: "(601) 555-0124",
    dealName: "Bean Path Property Commercial Loan",
    dealType: "CRE",
    program: "Commercial Acquisition",
    propertyAddress: "Bean Path Property",
    market: "Jackson, MS",
    occupancy: "Owner-managed commercial asset",
    loanAmount: 1850000,
    estimatedValue: 2650000,
    source: "Existing client file",
    notes:
      "Pattern based on the Bean Barn Properties file: bank statements, profit and loss, balance sheet, operating agreement, good standing certificate, appraisal quote, and conditional approval.",
  },
};
