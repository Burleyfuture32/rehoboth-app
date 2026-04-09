import prismaPackage from "@prisma/client";

const {
  CapitalSourceStatus,
  PrismaClient,
  DealStage,
  DealType,
  DocumentStatus,
  StatusTrackerSectionKey,
  StatusTrackerStatus,
  SubmissionStatus,
  TaskPriority,
  TaskStatus,
} = prismaPackage;

const prisma = new PrismaClient();

async function main() {
  await prisma.lenderRatesheet.deleteMany();
  await prisma.dealKnowledgeEntry.deleteMany();
  await prisma.communicationLog.deleteMany();
  await prisma.capitalSourceMatch.deleteMany();
  await prisma.dealActivity.deleteMany();
  await prisma.loanFile.deleteMany();
  await prisma.statusTrackerSection.deleteMany();
  await prisma.documentRequest.deleteMany();
  await prisma.task.deleteMany();
  await prisma.deal.deleteMany();
  await prisma.borrower.deleteMany();

  const borrowers = await prisma.$transaction([
    prisma.borrower.create({
      data: {
        name: "Bean Barn Properties LLC",
        entityType: "LLC",
        experience: "Commercial file includes P&L, balance sheet, and conditional approval",
        email: "nashlie.sephus@example.com",
        phone: "(601) 555-0124",
      },
    }),
    prisma.borrower.create({
      data: {
        name: "Tim Webb",
        entityType: "Individual",
        experience: "Residential file includes 1003, IDIQ reports, and USAA statements",
        email: "tim.webb@example.com",
        phone: "(404) 555-0172",
      },
    }),
    prisma.borrower.create({
      data: {
        name: "K&M Rental LLC",
        entityType: "LLC",
        experience: "Auto-related commercial package with title, survey, bank statements, and good standing",
        email: "km.auto@example.com",
        phone: "(770) 555-0193",
      },
    }),
    prisma.borrower.create({
      data: {
        name: "Patriot Square",
        entityType: "Commercial Project",
        experience: "File includes executive loan summary, buyer letters, and option agreement",
        email: "patriot.square@example.com",
        phone: "(404) 555-0111",
      },
    }),
  ]);

  await prisma.deal.createMany({
    data: [
      {
        borrowerId: borrowers[0].id,
        name: "Bean Path Property Commercial Loan",
        dealType: DealType.CRE,
        stage: DealStage.UNDERWRITING,
        program: "Commercial Acquisition",
        propertyAddress: "Bean Path Property",
        market: "Jackson, MS",
        occupancy: "Owner-managed commercial asset",
        source: "Client file",
        loanAmount: 1850000,
        estimatedValue: 2650000,
        ltv: 70,
        summary:
          "Seeded from the Beanpath folder: appraisal quote, conditional approval, bank statements, profit and loss, balance sheet, EIN, and operating agreement.",
        targetCloseDate: new Date("2026-04-24T00:00:00.000Z"),
      },
      {
        borrowerId: borrowers[1].id,
        name: "Tim Webb Home Loan",
        dealType: DealType.RESIDENTIAL,
        stage: DealStage.PROCESSING,
        program: "Residential Purchase",
        propertyAddress: "Atlanta Metro Home Purchase",
        market: "Atlanta, GA",
        occupancy: "Primary residence",
        source: "Client file",
        loanAmount: 328000,
        estimatedValue: 410000,
        ltv: 80,
        summary:
          "Seeded from the Tim Webb folder: 1003 URLA, Tim and Za credit reports, personal statement, USAA checking statements, and transfer receipts.",
        targetCloseDate: new Date("2026-05-08T00:00:00.000Z"),
      },
      {
        borrowerId: borrowers[2].id,
        name: "KM Auto Commercial Package",
        dealType: DealType.CRE,
        stage: DealStage.DOCS_REQUESTED,
        program: "Owner-User Commercial",
        propertyAddress: "K&M Auto Site",
        market: "Georgia",
        occupancy: "Business occupied",
        source: "Client file",
        loanAmount: 1240000,
        estimatedValue: 1770000,
        ltv: 70,
        summary:
          "Seeded from the KM Auto folder: title commitment, survey, floor plans, operations agreements, bank statements, and closing conditions checklist.",
        targetCloseDate: new Date("2026-04-30T00:00:00.000Z"),
      },
      {
        borrowerId: borrowers[3].id,
        name: "Patriot Square Loan Package",
        dealType: DealType.CRE,
        stage: DealStage.CLOSING,
        program: "Acquisition / Development",
        propertyAddress: "Patriot Square",
        market: "Georgia",
        occupancy: "Project closing stage",
        source: "Client file",
        loanAmount: 2850000,
        estimatedValue: 4100000,
        ltv: 70,
        summary:
          "Seeded from the Patriot Square folder: executive loan summary, loan submission sheet, buyer proof of funds, pre-approval letters, and option agreement.",
        targetCloseDate: new Date("2026-04-11T00:00:00.000Z"),
      },
    ],
  });

  const deals = await prisma.deal.findMany({
    select: {
      id: true,
      name: true,
      borrower: {
        select: {
          name: true,
        },
      },
      targetCloseDate: true,
    },
  });

  const dealIdByName = Object.fromEntries(deals.map((deal) => [deal.name, deal.id]));

  await prisma.statusTrackerSection.createMany({
    data: deals.flatMap((deal) =>
      buildStarterStatusTrackerSections({
        dealId: deal.id,
        borrowerName: deal.borrower.name,
        targetCloseDate: deal.targetCloseDate,
      }),
    ),
  });

  await prisma.task.createMany({
    data: [
      {
        dealId: dealIdByName["Bean Path Property Commercial Loan"],
        title: "Review conditional approval terms",
        owner: "Avery Shaw",
        dueDate: new Date("2026-04-03T00:00:00.000Z"),
        priority: TaskPriority.HIGH,
        status: TaskStatus.OPEN,
        category: "Credit",
      },
      {
        dealId: dealIdByName["Bean Path Property Commercial Loan"],
        title: "Confirm operating agreement and good standing are current",
        owner: "Nora Wells",
        dueDate: new Date("2026-04-04T00:00:00.000Z"),
        priority: TaskPriority.MEDIUM,
        status: TaskStatus.OPEN,
        category: "Entity",
      },
      {
        dealId: dealIdByName["Tim Webb Home Loan"],
        title: "Review 1003 and borrower credit reports",
        owner: "Avery Shaw",
        dueDate: new Date("2026-04-03T00:00:00.000Z"),
        priority: TaskPriority.HIGH,
        status: TaskStatus.OPEN,
        category: "Intake",
      },
      {
        dealId: dealIdByName["Tim Webb Home Loan"],
        title: "Verify latest USAA bank statement balances",
        owner: "Marcus Reed",
        dueDate: new Date("2026-04-05T00:00:00.000Z"),
        priority: TaskPriority.MEDIUM,
        status: TaskStatus.OPEN,
        category: "Assets",
      },
      {
        dealId: dealIdByName["KM Auto Commercial Package"],
        title: "Request updated title commitment and survey",
        owner: "Nora Wells",
        dueDate: new Date("2026-04-02T00:00:00.000Z"),
        priority: TaskPriority.HIGH,
        status: TaskStatus.OPEN,
        category: "Collateral",
      },
      {
        dealId: dealIdByName["KM Auto Commercial Package"],
        title: "Review closing conditions checklist",
        owner: "Marcus Reed",
        dueDate: new Date("2026-04-06T00:00:00.000Z"),
        priority: TaskPriority.MEDIUM,
        status: TaskStatus.OPEN,
        category: "Closing",
      },
      {
        dealId: dealIdByName["Patriot Square Loan Package"],
        title: "Confirm buyer proof of funds and pre-approval letters",
        owner: "Avery Shaw",
        dueDate: new Date("2026-04-02T00:00:00.000Z"),
        priority: TaskPriority.HIGH,
        status: TaskStatus.OPEN,
        category: "Underwriting",
      },
      {
        dealId: dealIdByName["Patriot Square Loan Package"],
        title: "Finalize option agreement package",
        owner: "Nora Wells",
        dueDate: new Date("2026-04-01T00:00:00.000Z"),
        priority: TaskPriority.LOW,
        status: TaskStatus.DONE,
        category: "Legal",
      },
    ],
  });

  await prisma.documentRequest.createMany({
    data: [
      {
        dealId: dealIdByName["Bean Path Property Commercial Loan"],
        title: "Latest business bank statements",
        category: "Financials",
        requestedBy: "Nora Wells",
        notes: "Use the most recent full monthly statements for underwriting refresh.",
        status: DocumentStatus.REQUESTED,
      },
      {
        dealId: dealIdByName["Bean Path Property Commercial Loan"],
        title: "Operating agreement for Bean Barn Properties LLC",
        category: "Entity",
        requestedBy: "Nora Wells",
        notes: "Current signed operating agreement from the Beanpath file.",
        status: DocumentStatus.UPLOADED,
        uploadedFileName: "bean barn properties_operating agreement.pdf",
        uploadedAt: new Date("2026-04-01T00:00:00.000Z"),
      },
      {
        dealId: dealIdByName["Bean Path Property Commercial Loan"],
        title: "Conditional approval letter",
        category: "Credit",
        requestedBy: "Avery Shaw",
        notes: "Investor demo example from the Bean Path file set.",
        status: DocumentStatus.UPLOADED,
        uploadedFileName: "Bean Path properties Conditional Approval.pdf",
        uploadedAt: new Date("2026-03-31T00:00:00.000Z"),
      },
      {
        dealId: dealIdByName["Tim Webb Home Loan"],
        title: "Signed 1003 loan application",
        category: "Application",
        requestedBy: "Avery Shaw",
        notes: "Use the latest URLA package for Tim Webb.",
        status: DocumentStatus.UPLOADED,
        uploadedFileName: "1003 URLA (Loan Application TW ZZ).pdf",
        uploadedAt: new Date("2026-04-01T00:00:00.000Z"),
      },
      {
        dealId: dealIdByName["Tim Webb Home Loan"],
        title: "IDIQ credit reports for Tim and Za",
        category: "Credit",
        requestedBy: "Avery Shaw",
        notes: "Combined borrower credit review from the residential folder.",
        status: DocumentStatus.UPLOADED,
        uploadedFileName: "IDIQ-Credit report - Tim Webb.pdf",
        uploadedAt: new Date("2026-04-01T00:00:00.000Z"),
      },
      {
        dealId: dealIdByName["Tim Webb Home Loan"],
        title: "Most recent USAA checking statements",
        category: "Assets",
        requestedBy: "Marcus Reed",
        notes: "Need the latest statements after the September and October files.",
        status: DocumentStatus.REQUESTED,
      },
      {
        dealId: dealIdByName["Tim Webb Home Loan"],
        title: "Transfer receipts and proof of funds",
        category: "Assets",
        requestedBy: "Marcus Reed",
        notes: "Collect the incoming transfer backup used for closing funds.",
        status: DocumentStatus.REQUESTED,
      },
      {
        dealId: dealIdByName["KM Auto Commercial Package"],
        title: "Updated title commitment",
        category: "Collateral",
        requestedBy: "Nora Wells",
        notes: "Current title commitment is still outstanding.",
        status: DocumentStatus.REQUESTED,
      },
      {
        dealId: dealIdByName["KM Auto Commercial Package"],
        title: "Current survey",
        category: "Collateral",
        requestedBy: "Nora Wells",
        notes: "Need the latest signed survey for the property file.",
        status: DocumentStatus.REQUESTED,
      },
      {
        dealId: dealIdByName["KM Auto Commercial Package"],
        title: "Operating agreement and good standing",
        category: "Entity",
        requestedBy: "Avery Shaw",
        notes: "Existing entity packet from the K&M Auto file.",
        status: DocumentStatus.UPLOADED,
        uploadedFileName: "KM Auto entity packet.pdf",
        uploadedAt: new Date("2026-03-30T00:00:00.000Z"),
      },
      {
        dealId: dealIdByName["Patriot Square Loan Package"],
        title: "Buyer proof of funds",
        category: "Liquidity",
        requestedBy: "Avery Shaw",
        notes: "Investor demo example from the Patriot Square folder.",
        status: DocumentStatus.UPLOADED,
        uploadedFileName: "Patriot Square proof of funds.pdf",
        uploadedAt: new Date("2026-03-31T00:00:00.000Z"),
      },
      {
        dealId: dealIdByName["Patriot Square Loan Package"],
        title: "Pre-approval letters",
        category: "Credit",
        requestedBy: "Marcus Reed",
        notes: "Keep final letters in the closing package.",
        status: DocumentStatus.UPLOADED,
        uploadedFileName: "Patriot Square pre-approval letters.pdf",
        uploadedAt: new Date("2026-03-31T00:00:00.000Z"),
      },
      {
        dealId: dealIdByName["Patriot Square Loan Package"],
        title: "Executed option agreement",
        category: "Legal",
        requestedBy: "Nora Wells",
        notes: "Need the final executed version for the close file.",
        status: DocumentStatus.REQUESTED,
      },
    ],
  });

  await prisma.loanFile.createMany({
    data: [
      {
        dealId: dealIdByName["Bean Path Property Commercial Loan"],
        borrowerLegalName: "Bean Barn Properties LLC",
        borrowerTaxId: "XX-4821",
        entityLegalName: "Bean Barn Properties LLC",
        entityState: "Mississippi",
        guarantors: "Nashlie Sephus",
        referralSource: "Client file",
        loanPurpose: "Commercial acquisition",
        requestedLoanAmount: "1850000",
        purchasePrice: "2400000",
        estimatedValue: "2650000",
        cashToClose: "575000",
        termMonths: "12",
        amortizationMonths: "300",
        ratePreference: "Bridge / interest-only",
        propertyType: "Commercial mixed-use property",
        occupancyPlan: "Owner-managed commercial asset",
        unitCount: "1",
        yearBuilt: "1988",
        titleStatus: "Preliminary review started",
        appraisalStatus: "Quote received",
        insuranceStatus: "Binder pending",
        floodZoneStatus: "Review map cert",
        monthlyIncome: "42000",
        monthlyDebt: "11800",
        liquidAssets: "690000",
        reservesOnHand: "9 months",
        noi: "287000",
        dscr: "1.42",
        creditScore: "Strong sponsor profile",
        dti: "N/A",
        backgroundSummary:
          "Beanpath file shows current P&L, balance sheet, entity records, and conditional approval support.",
        conditionsSummary:
          "Update bank statements, finalize title work, and confirm appraisal path.",
        missingItemsSummary:
          "Latest bank statements, final title items, insurance binder.",
        processorNotes:
          "File is clean for a CRE bridge package. Entity and sponsor support are already strong.",
        underwritingNotes:
          "Conditional approval aligns with requested structure at 70 percent leverage.",
        submissionStatus: SubmissionStatus.READY_TO_SUBMIT,
        recommendedAction: "Submit updated financial package to two bridge lenders.",
        submissionNotes:
          "Strong sponsor story and document depth. Hold only for refreshed statements and title path.",
        closingAttorney: "To be assigned",
        closingConditions: "Clear title, insurance binder, updated bank statements.",
        targetClosingDate: "2026-04-24",
        fundedAmount: "",
        firstPaymentDate: "",
        exitStrategy: "Refinance into longer-term debt after stabilization.",
        relationshipNotes:
          "Good repeat-file candidate once this first commercial package closes cleanly.",
      },
      {
        dealId: dealIdByName["Tim Webb Home Loan"],
        borrowerLegalName: "Tim Webb",
        borrowerTaxId: "XXX-XX-2148",
        borrowerDob: "1986-08-14",
        coBorrowerName: "Za Webb",
        coBorrowerCreditScore: "708",
        referralSource: "Client file",
        loanPurpose: "Primary residence purchase",
        requestedLoanAmount: "328000",
        purchasePrice: "410000",
        estimatedValue: "410000",
        cashToClose: "82000",
        termMonths: "360",
        amortizationMonths: "360",
        ratePreference: "30-year fixed",
        propertyType: "Single family detached",
        occupancyPlan: "Primary residence",
        unitCount: "1",
        yearBuilt: "2004",
        titleStatus: "Not ordered",
        appraisalStatus: "Ready to order",
        insuranceStatus: "Need homeowner quote",
        floodZoneStatus: "Not in flood zone per borrower",
        monthlyIncome: "12450",
        monthlyDebt: "2575",
        liquidAssets: "96500",
        reservesOnHand: "6 months",
        noi: "",
        dscr: "",
        creditScore: "714",
        dti: "31%",
        backgroundSummary:
          "File includes URLA, Tim and Za credit reports, personal statement, USAA statements, and transfer backup.",
        conditionsSummary:
          "Need refreshed asset verification, homeowner insurance quote, and title order.",
        missingItemsSummary:
          "Latest USAA statements, transfer receipts, insurance quote.",
        processorNotes:
          "Residential file is organized and should move quickly once updated asset docs are in.",
        underwritingNotes:
          "Income and liabilities look workable pending final AUS and asset review.",
        submissionStatus: SubmissionStatus.NOT_READY,
        recommendedAction: "Collect the last asset items before lender submission.",
        submissionNotes:
          "Borrower file is close, but it still needs updated cash-to-close support.",
        closingAttorney: "Borrower to select",
        closingConditions: "Clear title, updated statements, homeowner insurance, final approval.",
        targetClosingDate: "2026-05-08",
        fundedAmount: "",
        firstPaymentDate: "",
        exitStrategy: "Owner occupied long-term hold.",
        relationshipNotes:
          "Good borrower education opportunity because the process is straightforward and document-driven.",
      },
      {
        dealId: dealIdByName["KM Auto Commercial Package"],
        borrowerLegalName: "K&M Rental LLC",
        borrowerTaxId: "XX-9017",
        entityLegalName: "K&M Rental LLC",
        entityState: "Georgia",
        guarantors: "Primary operating member on file",
        referralSource: "Client file",
        loanPurpose: "Owner-user commercial refinance / reposition",
        requestedLoanAmount: "1240000",
        purchasePrice: "",
        estimatedValue: "1770000",
        cashToClose: "Title and closing fees only",
        termMonths: "24",
        amortizationMonths: "300",
        ratePreference: "Bridge then perm takeout",
        propertyType: "Auto service commercial site",
        occupancyPlan: "Business occupied",
        unitCount: "1",
        yearBuilt: "1996",
        titleStatus: "Updated commitment requested",
        appraisalStatus: "Need current valuation path",
        insuranceStatus: "Existing policy to refresh",
        floodZoneStatus: "To confirm with survey",
        monthlyIncome: "36800",
        monthlyDebt: "14950",
        liquidAssets: "143000",
        reservesOnHand: "4 months",
        noi: "201000",
        dscr: "1.28",
        creditScore: "Business file review",
        dti: "N/A",
        backgroundSummary:
          "KM Auto package already includes title, survey, floor plans, bank statements, and entity records.",
        conditionsSummary:
          "Waiting on updated title commitment, current survey, and refreshed valuation support.",
        missingItemsSummary:
          "Updated title commitment, current survey, any revised insurance cert.",
        processorNotes:
          "This file should live in docs requested until collateral items are refreshed.",
        underwritingNotes:
          "Collateral file is the gating item, not borrower narrative.",
        submissionStatus: SubmissionStatus.NOT_READY,
        recommendedAction: "Keep lender outreach warm while collateral items are refreshed.",
        submissionNotes:
          "Do not submit broadly until title and survey are current.",
        closingAttorney: "To be assigned",
        closingConditions: "Updated title, current survey, insurance verification.",
        targetClosingDate: "2026-04-30",
        fundedAmount: "",
        firstPaymentDate: "",
        exitStrategy: "Refinance after cleanup of collateral package.",
        relationshipNotes:
          "Business borrower likely benefits from one-page conditional checklist during processing.",
      },
      {
        dealId: dealIdByName["Patriot Square Loan Package"],
        borrowerLegalName: "Patriot Square",
        borrowerTaxId: "Project SPV",
        entityLegalName: "Patriot Square project entity",
        entityState: "Georgia",
        guarantors: "Buyer group and project sponsor",
        referralSource: "Client file",
        loanPurpose: "Acquisition / development",
        requestedLoanAmount: "2850000",
        purchasePrice: "3900000",
        estimatedValue: "4100000",
        cashToClose: "Sponsor equity plus fees",
        termMonths: "18",
        amortizationMonths: "300",
        ratePreference: "Interest only during project close",
        propertyType: "Commercial project",
        occupancyPlan: "Project closing stage",
        unitCount: "1",
        yearBuilt: "N/A",
        titleStatus: "Closing review",
        appraisalStatus: "Package supported by summary and sponsor materials",
        insuranceStatus: "Bind at closing",
        floodZoneStatus: "Project review complete",
        monthlyIncome: "",
        monthlyDebt: "",
        liquidAssets: "Buyer proof of funds on file",
        reservesOnHand: "Sponsor liquidity verified",
        noi: "",
        dscr: "",
        creditScore: "Sponsor-backed",
        dti: "N/A",
        backgroundSummary:
          "Executive loan summary, buyer letters, proof of funds, pre-approvals, and option agreement are already in file.",
        conditionsSummary:
          "Finalize option agreement, close title and legal review, prepare funded file.",
        missingItemsSummary:
          "Executed option agreement and final legal close set.",
        processorNotes:
          "Most of this file is already in the closing lane. Keep legal and funding items visible.",
        underwritingNotes:
          "Underwriting concerns are mostly cleared; this is now a close-execution file.",
        submissionStatus: SubmissionStatus.SUBMITTED,
        recommendedAction: "Finalize closing conditions and prepare the funded file.",
        submissionNotes:
          "This file is already effectively in lender execution and should not return to early-stage review.",
        closingAttorney: "Project closing counsel",
        closingConditions: "Executed option agreement, final title, funding authorization.",
        targetClosingDate: "2026-04-11",
        fundedAmount: "",
        firstPaymentDate: "",
        exitStrategy: "Project completion and takeout financing.",
        relationshipNotes:
          "Useful showcase file for late-stage lender confidence and sponsor readiness.",
      },
    ],
  });

  await prisma.capitalSourceMatch.createMany({
    data: [
      {
        dealId: dealIdByName["Bean Path Property Commercial Loan"],
        lenderName: "Southern Bridge Capital",
        program: "12-month bridge acquisition",
        status: CapitalSourceStatus.QUOTE_RECEIVED,
        quoteAmount: "1850000",
        leverage: "70% LTC / LTV",
        rate: "10.25%",
        notes: "Best fit for speed. Waiting on refreshed bank statements.",
      },
      {
        dealId: dealIdByName["Bean Path Property Commercial Loan"],
        lenderName: "Delta Commercial Credit",
        program: "Short-term CRE bridge",
        status: CapitalSourceStatus.SUBMITTED,
        quoteAmount: "1800000",
        leverage: "68%",
        rate: "10.75%",
        notes: "Backup option with slightly higher spread.",
      },
      {
        dealId: dealIdByName["Tim Webb Home Loan"],
        lenderName: "Heritage Home Lending",
        program: "Conventional 30-year fixed",
        status: CapitalSourceStatus.TARGETED,
        quoteAmount: "328000",
        leverage: "80%",
        rate: "6.62%",
        notes: "Ready once final assets and insurance quote are in.",
      },
      {
        dealId: dealIdByName["KM Auto Commercial Package"],
        lenderName: "Metro Business Finance",
        program: "Owner-user commercial",
        status: CapitalSourceStatus.TARGETED,
        quoteAmount: "1240000",
        leverage: "70%",
        rate: "9.85%",
        notes: "Hold submission until title and survey refresh is complete.",
      },
      {
        dealId: dealIdByName["Patriot Square Loan Package"],
        lenderName: "Patriot Project Lending Desk",
        program: "Acquisition / development execution",
        status: CapitalSourceStatus.SUBMITTED,
        quoteAmount: "2850000",
        leverage: "69%",
        rate: "9.25%",
        notes: "In execution. Final legal close conditions remain.",
      },
    ],
  });

  await prisma.dealActivity.createMany({
    data: [
      {
        dealId: dealIdByName["Bean Path Property Commercial Loan"],
        title: "Conditional approval reviewed",
        body: "Team reviewed the conditional approval and aligned the next document asks with the lender terms.",
        createdBy: "Avery Shaw",
        kind: "NOTE",
      },
      {
        dealId: dealIdByName["Bean Path Property Commercial Loan"],
        title: "Bridge lender shortlist updated",
        body: "Southern Bridge Capital and Delta Commercial Credit are the two best current fits for speed and leverage.",
        createdBy: "Nora Wells",
        kind: "NOTE",
      },
      {
        dealId: dealIdByName["Tim Webb Home Loan"],
        title: "Borrower follow-up sent",
        body: "Requested the latest USAA statements, transfer receipts, and homeowner quote before lender submission.",
        createdBy: "Marcus Reed",
        kind: "NOTE",
      },
      {
        dealId: dealIdByName["KM Auto Commercial Package"],
        title: "Collateral gap identified",
        body: "The file is document-rich overall, but lender outreach should stay limited until the updated title commitment and survey arrive.",
        createdBy: "Nora Wells",
        kind: "NOTE",
      },
      {
        dealId: dealIdByName["Patriot Square Loan Package"],
        title: "Closing lane confirmed",
        body: "File is effectively in execution. Remaining work is legal package completion and funding coordination.",
        createdBy: "Avery Shaw",
        kind: "NOTE",
      },
    ],
  });

  await prisma.dealKnowledgeEntry.createMany({
    data: [
      {
        dealId: dealIdByName["Bean Path Property Commercial Loan"],
        question: "What is the best next move before bridge submission?",
        answer:
          "Refresh the business bank statements first, then keep Southern Bridge Capital and Delta Commercial Credit as the two live bridge options because the sponsor and entity package are already strong.",
        resourceKey: "capital-sources",
        createdBy: "Knowledge Base",
      },
      {
        dealId: dealIdByName["Tim Webb Home Loan"],
        question: "Why is this residential file not ready to submit yet?",
        answer:
          "The borrower package is mostly in place, but the final asset story still depends on the latest USAA statements, transfer receipts, and a homeowner insurance quote. Those three items are the real blockers.",
        resourceKey: "documents",
        createdBy: "Knowledge Base",
      },
      {
        dealId: dealIdByName["KM Auto Commercial Package"],
        question: "Should lender outreach continue while the collateral file is incomplete?",
        answer:
          "Keep the lender conversation warm, but do not broaden submission until the title commitment and survey are current. The collateral refresh is the gating issue, not the borrower story.",
        resourceKey: "submission-summary",
        createdBy: "Knowledge Base",
      },
    ],
  });

  await prisma.communicationLog.createMany({
    data: [
      {
        dealId: dealIdByName["Bean Path Property Commercial Loan"],
        channel: "EMAIL",
        direction: "OUTBOUND",
        contactName: "Nashlie Sephus",
        contactValue: "nashlie.sephus@example.com",
        subject: "Updated bank statements needed for bridge submission",
        message:
          "Sent a short checklist requesting the latest operating account statements and insurance binder timing.",
        outcome: "Borrower said the statements will come over this afternoon.",
        createdBy: "Nora Wells",
      },
      {
        dealId: dealIdByName["Bean Path Property Commercial Loan"],
        channel: "CALL",
        direction: "OUTBOUND",
        contactName: "Maya Brooks",
        contactValue: "Southern Bridge Capital",
        subject: "Bridge lender follow-up",
        message:
          "Called Southern Bridge Capital to confirm leverage and timing once refreshed statements are in.",
        outcome: "Quote remains good. Lender can move once the refreshed statements land.",
        createdBy: "Avery Shaw",
      },
      {
        dealId: dealIdByName["Tim Webb Home Loan"],
        channel: "TEXT",
        direction: "OUTBOUND",
        contactName: "Tim Webb",
        contactValue: "(404) 555-0172",
        subject: "Asset docs reminder",
        message:
          "Texted borrower a simple reminder for the latest USAA statements and transfer receipts.",
        outcome: "Borrower replied that the statements will be uploaded tonight.",
        createdBy: "Marcus Reed",
      },
      {
        dealId: dealIdByName["Tim Webb Home Loan"],
        channel: "EMAIL",
        direction: "INBOUND",
        contactName: "Tim Webb",
        contactValue: "tim.webb@example.com",
        subject: "Homeowners quote in progress",
        message:
          "Borrower emailed that the insurance quote request is in process and should be ready after agent review.",
        outcome: "Waiting on formal quote PDF.",
        createdBy: "Tim Webb",
      },
      {
        dealId: dealIdByName["KM Auto Commercial Package"],
        channel: "CALL",
        direction: "OUTBOUND",
        contactName: "K&M Rental LLC",
        contactValue: "(770) 555-0193",
        subject: "Collateral refresh call",
        message:
          "Called borrower contact to explain why the updated title commitment and survey are the gating items.",
        outcome: "Borrower understands the hold and is checking with title today.",
        createdBy: "Nora Wells",
      },
      {
        dealId: dealIdByName["Patriot Square Loan Package"],
        channel: "EMAIL",
        direction: "OUTBOUND",
        contactName: "Project closing counsel",
        contactValue: "closing.counsel@example.com",
        subject: "Final option agreement timing",
        message:
          "Requested closing counsel timing for the executed option agreement and final legal close package.",
        outcome: "Counsel expects final signatures before Friday noon.",
        createdBy: "Avery Shaw",
      },
    ],
  });

  await prisma.lenderRatesheet.createMany({
    data: [
      {
        lenderName: "Southern Bridge Capital",
        programName: "Bridge acquisition",
        dealTypes: "CRE",
        propertyFocus: "Mixed-use, retail, small balance commercial",
        markets: "MS, AL, GA, TN",
        minLoanAmount: "500000",
        maxLoanAmount: "5000000",
        maxLeverage: "70% LTC / 70% LTV",
        minDscr: "1.15",
        minFico: "",
        rateRange: "9.75% - 10.75%",
        termOptions: "12-24 months interest only",
        recourse: "Warm recourse preferred",
        turnTime: "5-7 business days to quote",
        contactName: "Maya Brooks",
        contactEmail: "maya.brooks@southernbridge.example.com",
        notes: "Best fit for fast bridge execution when sponsor package is clean.",
        updatedAtLabel: "Apr 2026",
      },
      {
        lenderName: "Delta Commercial Credit",
        programName: "Short-term CRE bridge",
        dealTypes: "CRE",
        propertyFocus: "Office, owner-user, neighborhood retail",
        markets: "Southeast regional",
        minLoanAmount: "750000",
        maxLoanAmount: "7000000",
        maxLeverage: "68% LTV",
        minDscr: "1.20",
        minFico: "",
        rateRange: "10.25% - 11.25%",
        termOptions: "12-18 months",
        recourse: "Case by case",
        turnTime: "7-10 business days",
        contactName: "Elijah Price",
        contactEmail: "elijah.price@deltacredit.example.com",
        notes: "Good backup bridge source when timing matters more than pricing.",
        updatedAtLabel: "Apr 2026",
      },
      {
        lenderName: "Heritage Home Lending",
        programName: "Conventional 30-year fixed",
        dealTypes: "RESIDENTIAL",
        propertyFocus: "Primary residence, second home",
        markets: "GA, FL, AL, NC",
        minLoanAmount: "150000",
        maxLoanAmount: "766550",
        maxLeverage: "80% LTV",
        minDscr: "",
        minFico: "680",
        rateRange: "6.375% - 6.75%",
        termOptions: "30-year fixed",
        recourse: "Full borrower recourse",
        turnTime: "3-5 business days",
        contactName: "Lena Carter",
        contactEmail: "lena.carter@heritagehome.example.com",
        notes: "Strong conventional fit once assets and insurance are complete.",
        updatedAtLabel: "Apr 2026",
      },
      {
        lenderName: "Metro Business Finance",
        programName: "Owner-user commercial",
        dealTypes: "CRE",
        propertyFocus: "Auto, warehouse, light industrial owner-user",
        markets: "GA, SC, TN",
        minLoanAmount: "400000",
        maxLoanAmount: "3500000",
        maxLeverage: "70% LTV",
        minDscr: "1.25",
        minFico: "",
        rateRange: "9.25% - 10.0%",
        termOptions: "24 months then takeout",
        recourse: "Sponsor recourse required",
        turnTime: "5 business days",
        contactName: "Jordan Ellis",
        contactEmail: "jordan.ellis@metrobf.example.com",
        notes: "Works well for owner-user files once title and survey are current.",
        updatedAtLabel: "Apr 2026",
      },
      {
        lenderName: "Patriot Project Lending Desk",
        programName: "Acquisition / development execution",
        dealTypes: "CRE",
        propertyFocus: "Land, development, structured project finance",
        markets: "Selective Southeast",
        minLoanAmount: "1500000",
        maxLoanAmount: "10000000",
        maxLeverage: "69% LTC",
        minDscr: "",
        minFico: "",
        rateRange: "8.95% - 9.65%",
        termOptions: "18-24 months interest only",
        recourse: "Structured sponsor carveouts",
        turnTime: "7 business days",
        contactName: "Simone Avery",
        contactEmail: "simone.avery@patriotdesk.example.com",
        notes: "Strong project execution desk once legal and title package is aligned.",
        updatedAtLabel: "Apr 2026",
      },
      {
        lenderName: "Summit DSCR Funding",
        programName: "Rental / DSCR long-term",
        dealTypes: "RESIDENTIAL",
        propertyFocus: "Investor 1-4 unit rental",
        markets: "Nationwide focus with Southeast strength",
        minLoanAmount: "100000",
        maxLoanAmount: "3000000",
        maxLeverage: "80% LTV purchase / 75% cash-out",
        minDscr: "1.00",
        minFico: "660",
        rateRange: "7.15% - 8.10%",
        termOptions: "30-year fixed or interest-only",
        recourse: "Non-recourse available",
        turnTime: "3-5 business days",
        contactName: "Cara Nguyen",
        contactEmail: "cara.nguyen@summitdscr.example.com",
        notes: "Useful ratesheet to keep in front of investor-borrower files.",
        updatedAtLabel: "Apr 2026",
      },
    ],
  });
}

function buildStarterStatusTrackerSections({
  dealId,
  borrowerName,
  targetCloseDate,
}) {
  return [
    buildStatusTrackerSection({
      dealId,
      sectionKey: StatusTrackerSectionKey.BORROWER,
      personOrCompanyName: borrowerName,
      assignedToName: "Borrower",
      notes: "Waiting for borrower activity.",
      targetCloseDate,
      dueOffsetDays: -21,
    }),
    buildStatusTrackerSection({
      dealId,
      sectionKey: StatusTrackerSectionKey.LO,
      personOrCompanyName: "Kelvin Abram",
      assignedToName: "Kelvin Abram",
      notes: "No internal review started yet.",
      targetCloseDate,
      dueOffsetDays: -14,
    }),
    buildStatusTrackerSection({
      dealId,
      sectionKey: StatusTrackerSectionKey.TITLE,
      personOrCompanyName: "Unassigned",
      assignedToName: "Nora Wells",
      notes: "No title activity yet.",
      targetCloseDate,
      dueOffsetDays: -10,
    }),
    buildStatusTrackerSection({
      dealId,
      sectionKey: StatusTrackerSectionKey.LENDER,
      personOrCompanyName: "Rehoboth Group",
      assignedToName: "Marcus Reed",
      notes: "No lender submission yet.",
      targetCloseDate,
      dueOffsetDays: -7,
    }),
    buildStatusTrackerSection({
      dealId,
      sectionKey: StatusTrackerSectionKey.CLOSING,
      personOrCompanyName: "Unassigned",
      assignedToName: "Nora Wells",
      notes: "No closing prep yet.",
      targetCloseDate,
      dueOffsetDays: -2,
    }),
  ];
}

function buildStatusTrackerSection({
  dealId,
  sectionKey,
  personOrCompanyName,
  assignedToName,
  notes,
  targetCloseDate,
  dueOffsetDays,
}) {
  return {
    dealId,
    sectionKey,
    status: StatusTrackerStatus.NOT_STARTED,
    personOrCompanyName,
    assignedToName,
    notes,
    dueDate: addDays(targetCloseDate, dueOffsetDays),
    percentComplete: 0,
    updatedByName: "System",
  };
}

function addDays(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
