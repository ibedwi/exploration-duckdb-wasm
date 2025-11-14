import { getConnection } from "./client";
import type { Transaction, BalanceSheet } from "../data/types";

/**
 * Load transactions from a public JSON file URL
 */
export async function loadTransactionsFromURL(
  url: string = "/data/transactions.json"
): Promise<void> {
  const conn = await getConnection();

  // DuckDB can read JSON directly from URLs
  await conn.query(`
    CREATE OR REPLACE TABLE transactions AS
    SELECT * FROM read_json_auto('${url}')
  `);
}

/**
 * Load transactions from a JavaScript array
 */
export async function loadTransactionsFromArray(
  transactions: Transaction[]
): Promise<void> {
  const conn = await getConnection();

  // Create table schema
  await conn.query(`
    CREATE TABLE IF NOT EXISTS transactions (
      id VARCHAR PRIMARY KEY,
      date DATE,
      description VARCHAR,
      category VARCHAR,
      amount DOUBLE,
      balance DOUBLE,
      merchant VARCHAR,
      type VARCHAR
    )
  `);

  // Clear existing data
  await conn.query("DELETE FROM transactions");

  // Insert data batch by batch to avoid memory issues
  const batchSize = 100;
  for (let i = 0; i < transactions.length; i += batchSize) {
    const batch = transactions.slice(i, i + batchSize);

    // Convert to SQL INSERT statements
    const values = batch
      .map(
        (t) =>
          `('${t.id}', '${t.date}', '${t.description.replace(/'/g, "''")}', '${
            t.category
          }', ${t.amount}, ${t.balance}, '${t.merchant.replace(
            /'/g,
            "''"
          )}', '${t.type}')`
      )
      .join(",\n");

    await conn.query(`
      INSERT INTO transactions (id, date, description, category, amount, balance, merchant, type)
      VALUES ${values}
    `);
  }
}

/**
 * Load balance sheets from a public JSON file URL
 */
export async function loadBalanceSheetsFromURL(
  url: string = "/data/balance-sheets.json"
): Promise<void> {
  const conn = await getConnection();

  // Option 1: Load raw JSON (nested structure)
  await conn.query(`
    CREATE OR REPLACE TABLE balance_sheet_raw AS
    SELECT * FROM read_json_auto('${url}')
  `);

  // Option 2: Create flattened tables for easier querying
  await flattenBalanceSheetData();
}

/**
 * Load balance sheets from a JavaScript array
 */
export async function loadBalanceSheetsFromArray(
  balanceSheets: BalanceSheet[]
): Promise<void> {
  const conn = await getConnection();

  // Insert raw data first
  await conn.query(`
    CREATE TABLE IF NOT EXISTS balance_sheet_raw (
      period VARCHAR,
      date DATE,
      assets JSON,
      liabilities JSON,
      equity JSON,
      totalAssets DOUBLE,
      totalLiabilities DOUBLE,
      totalEquity DOUBLE
    )
  `);

  await conn.query("DELETE FROM balance_sheet_raw");

  // Insert balance sheets one by one
  for (const bs of balanceSheets) {
    await conn.query(`
      INSERT INTO balance_sheet_raw (period, date, assets, liabilities, equity, totalAssets, totalLiabilities, totalEquity)
      VALUES (
        '${bs.period}',
        '${bs.date}',
        '${JSON.stringify(bs.assets).replace(/'/g, "''")}',
        '${JSON.stringify(bs.liabilities).replace(/'/g, "''")}',
        '${JSON.stringify(bs.equity).replace(/'/g, "''")}',
        ${bs.totalAssets},
        ${bs.totalLiabilities},
        ${bs.totalEquity}
      )
    `);
  }

  // Flatten for easier querying
  await flattenBalanceSheetData();
}

/**
 * Flatten nested balance sheet data into a normalized table
 * This makes SQL queries much easier
 */
async function flattenBalanceSheetData(): Promise<void> {
  const conn = await getConnection();

  // Create flattened table combining all account types
  await conn.query(`
    CREATE OR REPLACE TABLE balance_sheet_accounts AS

    -- Assets
    SELECT
      period,
      date,
      'asset' as account_type,
      unnest(assets, recursive := true).name as account_name,
      unnest(assets, recursive := true).amount as amount,
      unnest(assets, recursive := true).category as category
    FROM balance_sheet_raw

    UNION ALL

    -- Liabilities
    SELECT
      period,
      date,
      'liability' as account_type,
      unnest(liabilities, recursive := true).name as account_name,
      unnest(liabilities, recursive := true).amount as amount,
      unnest(liabilities, recursive := true).category as category
    FROM balance_sheet_raw

    UNION ALL

    -- Equity (no category for equity items)
    SELECT
      period,
      date,
      'equity' as account_type,
      unnest(equity, recursive := true).name as account_name,
      unnest(equity, recursive := true).amount as amount,
      NULL as category
    FROM balance_sheet_raw
  `);

  // Create summary table
  await conn.query(`
    CREATE OR REPLACE TABLE balance_sheet_summary AS
    SELECT
      period,
      date,
      totalAssets,
      totalLiabilities,
      totalEquity
    FROM balance_sheet_raw
    ORDER BY date
  `);
}

/**
 * Load all data from public directory
 */
export async function loadAllData(): Promise<{
  transactionCount: number;
  balanceSheetCount: number;
}> {
  await loadTransactionsFromURL("/data/transactions.json");
  await loadBalanceSheetsFromURL("/data/balance-sheets.json");

  const conn = await getConnection();

  // Get counts
  const txnCount = await conn.query(
    "SELECT COUNT(*) as count FROM transactions"
  );
  const bsCount = await conn.query(
    "SELECT COUNT(*) as count FROM balance_sheet_raw"
  );

  return {
    transactionCount: txnCount.toArray()[0].count,
    balanceSheetCount: bsCount.toArray()[0].count,
  };
}

/**
 * Verify data is loaded correctly
 */
export async function verifyDataLoaded(): Promise<{
  transactionsLoaded: boolean;
  balanceSheetsLoaded: boolean;
  tableList: string[];
}> {
  const conn = await getConnection();

  // Get list of tables
  const tables = await conn.query(`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'main'
  `);

  const tableNames = tables.toArray().map((row: any) => row.table_name);

  return {
    transactionsLoaded: tableNames.includes("transactions"),
    balanceSheetsLoaded: tableNames.includes("balance_sheet_raw"),
    tableList: tableNames,
  };
}
