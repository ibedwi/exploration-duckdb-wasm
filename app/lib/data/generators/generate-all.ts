import { generateSampleTransactionData } from "./transactions";
import { generateSampleBalanceSheetData } from "./balance-sheet";

/**
 * Generate all sample data files
 * This can be run as a script or called from a route
 */
export function generateAllData() {
  const transactions = generateSampleTransactionData();
  const balanceSheets = generateSampleBalanceSheetData();

  return {
    transactions,
    balanceSheets,
    summary: {
      transactionCount: transactions.length,
      balanceSheetCount: balanceSheets.length,
      dateRange: {
        transactions: {
          start: transactions[0]?.date,
          end: transactions[transactions.length - 1]?.date,
        },
        balanceSheets: {
          start: balanceSheets[0]?.period,
          end: balanceSheets[balanceSheets.length - 1]?.period,
        },
      },
    },
  };
}

// Helper to convert data to formatted JSON string
export function dataToJSON(data: any): string {
  return JSON.stringify(data, null, 2);
}
