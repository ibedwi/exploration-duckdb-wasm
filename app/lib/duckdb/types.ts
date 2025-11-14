export interface Transaction {
  id: string;
  date: string; // ISO 8601 format
  description: string;
  category: string;
  amount: number; // Negative for expenses, positive for income
  balance: number; // Running balance after transaction
  merchant: string;
  type: "debit" | "credit";
}

export interface BalanceSheetAsset {
  name: string;
  amount: number;
  category: "current" | "non-current";
}

export interface BalanceSheetLiability {
  name: string;
  amount: number;
  category: "current" | "non-current";
}

export interface BalanceSheetEquity {
  name: string;
  amount: number;
}

export interface BalanceSheet {
  period: string; // e.g., "Q1 2024"
  date: string; // ISO 8601 format
  assets: BalanceSheetAsset[];
  liabilities: BalanceSheetLiability[];
  equity: BalanceSheetEquity[];
  totalAssets: number;
  totalLiabilities: number;
  totalEquity: number;
}

// Helper type for query results
export type QueryResult<T> = T[];
