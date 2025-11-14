import type {
  BalanceSheet,
  BalanceSheetAsset,
  BalanceSheetLiability,
  BalanceSheetEquity,
} from "../types";

interface GenerateOptions {
  year?: number;
  quarters?: number;
  seed?: number;
  startingEquity?: number;
}

// Seeded random number generator
class SeededRandom {
  private seed: number;

  constructor(seed: number) {
    this.seed = seed;
  }

  next(): number {
    this.seed = (this.seed * 9301 + 49297) % 233280;
    return this.seed / 233280;
  }

  nextFloat(min: number, max: number): number {
    return this.next() * (max - min) + min;
  }
}

export function generateBalanceSheets(
  options: GenerateOptions = {}
): BalanceSheet[] {
  const {
    year = 2024,
    quarters = 4,
    seed = 42,
    startingEquity = 50000,
  } = options;

  const rng = new SeededRandom(seed);
  const balanceSheets: BalanceSheet[] = [];

  // Starting values for the first quarter
  let retainedEarnings = startingEquity * 0.6;
  const commonStock = startingEquity * 0.4;

  for (let q = 1; q <= quarters; q++) {
    // Calculate quarter growth/decline
    const growthFactor = 1 + rng.nextFloat(-0.05, 0.15); // -5% to +15% per quarter

    // Generate Assets
    const cash = Math.round(rng.nextFloat(15000, 40000) * growthFactor);
    const accountsReceivable = Math.round(
      rng.nextFloat(8000, 20000) * growthFactor
    );
    const inventory = Math.round(rng.nextFloat(10000, 25000) * growthFactor);
    const prepaidExpenses = Math.round(rng.nextFloat(2000, 5000));

    const property = Math.round(rng.nextFloat(80000, 120000));
    const equipment = Math.round(rng.nextFloat(30000, 50000));
    const accumulatedDepreciation = -Math.round(
      (property + equipment) * 0.1 * q
    ); // Depreciation increases each quarter

    const assets: BalanceSheetAsset[] = [
      { name: "Cash and Cash Equivalents", amount: cash, category: "current" },
      {
        name: "Accounts Receivable",
        amount: accountsReceivable,
        category: "current",
      },
      { name: "Inventory", amount: inventory, category: "current" },
      {
        name: "Prepaid Expenses",
        amount: prepaidExpenses,
        category: "current",
      },
      {
        name: "Property, Plant & Equipment",
        amount: property,
        category: "non-current",
      },
      { name: "Equipment", amount: equipment, category: "non-current" },
      {
        name: "Accumulated Depreciation",
        amount: accumulatedDepreciation,
        category: "non-current",
      },
    ];

    const totalAssets = assets.reduce((sum, asset) => sum + asset.amount, 0);

    // Generate Liabilities
    const accountsPayable = Math.round(rng.nextFloat(5000, 15000));
    const shortTermDebt = Math.round(rng.nextFloat(8000, 12000));
    const accruedExpenses = Math.round(rng.nextFloat(3000, 7000));

    const longTermDebt = Math.round(rng.nextFloat(40000, 60000));
    const deferredTaxLiabilities = Math.round(rng.nextFloat(5000, 10000));

    const liabilities: BalanceSheetLiability[] = [
      {
        name: "Accounts Payable",
        amount: accountsPayable,
        category: "current",
      },
      {
        name: "Short-term Debt",
        amount: shortTermDebt,
        category: "current",
      },
      {
        name: "Accrued Expenses",
        amount: accruedExpenses,
        category: "current",
      },
      {
        name: "Long-term Debt",
        amount: longTermDebt,
        category: "non-current",
      },
      {
        name: "Deferred Tax Liabilities",
        amount: deferredTaxLiabilities,
        category: "non-current",
      },
    ];

    const totalLiabilities = liabilities.reduce(
      (sum, liability) => sum + liability.amount,
      0
    );

    // Calculate Equity (Assets - Liabilities = Equity)
    const totalEquity = totalAssets - totalLiabilities;

    // Adjust retained earnings to balance the equation
    retainedEarnings = totalEquity - commonStock;

    const equity: BalanceSheetEquity[] = [
      { name: "Common Stock", amount: commonStock },
      { name: "Retained Earnings", amount: retainedEarnings },
    ];

    // Get quarter end date
    const quarterEndMonth = q * 3; // Q1=Mar(3), Q2=Jun(6), Q3=Sep(9), Q4=Dec(12)
    const quarterEndDate = new Date(year, quarterEndMonth - 1, 1);
    const lastDayOfMonth = new Date(year, quarterEndMonth, 0).getDate();
    quarterEndDate.setDate(lastDayOfMonth);

    const balanceSheet: BalanceSheet = {
      period: `Q${q} ${year}`,
      date: quarterEndDate.toISOString().split("T")[0],
      assets,
      liabilities,
      equity,
      totalAssets: Math.round(totalAssets),
      totalLiabilities: Math.round(totalLiabilities),
      totalEquity: Math.round(totalEquity),
    };

    balanceSheets.push(balanceSheet);
  }

  return balanceSheets;
}

// Generate sample data for multiple years
export function generateMultiYearBalanceSheets(
  startYear: number,
  numYears: number
): BalanceSheet[] {
  const allSheets: BalanceSheet[] = [];

  for (let i = 0; i < numYears; i++) {
    const year = startYear + i;
    const sheets = generateBalanceSheets({
      year,
      quarters: 4,
      seed: year * 1000,
      startingEquity: 50000 + i * 5000, // Grow equity over years
    });
    allSheets.push(...sheets);
  }

  return allSheets;
}

// Generate sample data for demo
export function generateSampleBalanceSheetData(): BalanceSheet[] {
  return generateBalanceSheets({
    year: 2024,
    quarters: 4,
    seed: 54321,
    startingEquity: 75000,
  });
}

// Helper function to calculate financial metrics
export function calculateMetrics(sheet: BalanceSheet) {
  const currentAssets = sheet.assets
    .filter((a) => a.category === "current")
    .reduce((sum, a) => sum + a.amount, 0);

  const currentLiabilities = sheet.liabilities
    .filter((l) => l.category === "current")
    .reduce((sum, l) => sum + l.amount, 0);

  const currentRatio = currentAssets / currentLiabilities;
  const debtToEquityRatio = sheet.totalLiabilities / sheet.totalEquity;
  const workingCapital = currentAssets - currentLiabilities;

  return {
    currentRatio: Math.round(currentRatio * 100) / 100,
    debtToEquityRatio: Math.round(debtToEquityRatio * 100) / 100,
    workingCapital: Math.round(workingCapital),
    totalAssets: sheet.totalAssets,
    totalLiabilities: sheet.totalLiabilities,
    totalEquity: sheet.totalEquity,
  };
}
