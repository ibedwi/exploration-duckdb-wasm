// Data types for financial data
export interface Transaction {
  id: string;
  date: string; // ISO date
  description: string;
  category: string;
  amount: number; // negative for expenses, positive for income
  balance: number; // running balance after transaction
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
  date: string; // ISO date
  assets: BalanceSheetAsset[];
  liabilities: BalanceSheetLiability[];
  equity: BalanceSheetEquity[];
  totalAssets: number;
  totalLiabilities: number;
  totalEquity: number;
}
