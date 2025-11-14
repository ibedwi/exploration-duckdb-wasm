import { useState } from "react";
import { initializeDuckDB, query } from "~/lib/duckdb/client";
import { loadAllData, verifyDataLoaded } from "~/lib/duckdb/loader";

export default function LoadData() {
  const [status, setStatus] = useState<string>("Ready to load data");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [stats, setStats] = useState<{
    transactionCount: number;
    balanceSheetCount: number;
  } | null>(null);
  const [tables, setTables] = useState<string[]>([]);
  const [sampleTransactions, setSampleTransactions] = useState<any[]>([]);
  const [sampleBalanceSheet, setSampleBalanceSheet] = useState<any[]>([]);

  async function handleLoadData() {
    try {
      setLoading(true);
      setError("");

      setStatus("Initializing DuckDB...");
      await initializeDuckDB();

      setStatus("Loading transactions and balance sheets from /data/*.json...");
      const stats = await loadAllData();
      setStats(stats);

      setStatus("Verifying data loaded...");
      const verification = await verifyDataLoaded();
      setTables(verification.tableList);

      setStatus("Fetching sample data...");
      // Get sample transactions
      const txns = await query<any>(
        "SELECT * FROM transactions ORDER BY date DESC LIMIT 10"
      );
      setSampleTransactions(txns);

      // Get sample balance sheet accounts
      const bs = await query<any>(
        "SELECT * FROM balance_sheet_accounts WHERE period = 'Q4 2024' LIMIT 10"
      );
      setSampleBalanceSheet(bs);

      setStatus("✅ Data loaded successfully!");
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setStatus("❌ Error loading data");
      setLoading(false);
    }
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Load JSON Data into DuckDB</h1>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <h2 className="font-semibold text-lg mb-2">How This Works</h2>
        <ol className="text-sm space-y-1 list-decimal list-inside">
          <li>
            Initialize DuckDB WASM in the browser
          </li>
          <li>
            Load JSON files from <code className="bg-blue-100 px-1 rounded">/data/</code>{" "}
            directory
          </li>
          <li>
            Use DuckDB's <code className="bg-blue-100 px-1 rounded">read_json_auto()</code>{" "}
            function
          </li>
          <li>Create tables and flatten nested data</li>
          <li>Query the data using SQL</li>
        </ol>
      </div>

      {/* Status */}
      <div className="bg-gray-100 border border-gray-300 rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <strong>Status:</strong> {status}
          </div>
          {!loading && !stats && (
            <button
              onClick={handleLoadData}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 transition"
            >
              Load Data
            </button>
          )}
          {loading && (
            <div className="text-blue-600 font-semibold">Loading...</div>
          )}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-300 rounded-lg p-4 mb-6">
          <strong className="text-red-700">Error:</strong>
          <pre className="text-sm mt-2 text-red-800 whitespace-pre-wrap">{error}</pre>
        </div>
      )}

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="text-2xl font-bold text-green-700">
              {stats.transactionCount}
            </div>
            <div className="text-sm text-gray-600">Transactions Loaded</div>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="text-2xl font-bold text-green-700">
              {stats.balanceSheetCount}
            </div>
            <div className="text-sm text-gray-600">Balance Sheets Loaded</div>
          </div>
        </div>
      )}

      {/* Tables Created */}
      {tables.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
          <h3 className="font-semibold mb-2">Tables Created</h3>
          <div className="flex flex-wrap gap-2">
            {tables.map((table) => (
              <span
                key={table}
                className="bg-blue-100 text-blue-800 px-3 py-1 rounded text-sm font-mono"
              >
                {table}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Sample Transactions */}
      {sampleTransactions.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
          <h3 className="font-semibold mb-3">
            Sample Transactions (Latest 10)
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 px-2 py-1 text-left">
                    Date
                  </th>
                  <th className="border border-gray-300 px-2 py-1 text-left">
                    Merchant
                  </th>
                  <th className="border border-gray-300 px-2 py-1 text-left">
                    Category
                  </th>
                  <th className="border border-gray-300 px-2 py-1 text-left">
                    Description
                  </th>
                  <th className="border border-gray-300 px-2 py-1 text-right">
                    Amount
                  </th>
                  <th className="border border-gray-300 px-2 py-1 text-right">
                    Balance
                  </th>
                </tr>
              </thead>
              <tbody>
                {sampleTransactions.map((txn, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="border border-gray-300 px-2 py-1 font-mono text-xs">
                      {txn.date}
                    </td>
                    <td className="border border-gray-300 px-2 py-1">
                      {txn.merchant}
                    </td>
                    <td className="border border-gray-300 px-2 py-1">
                      <span className="text-xs bg-gray-200 px-2 py-0.5 rounded">
                        {txn.category}
                      </span>
                    </td>
                    <td className="border border-gray-300 px-2 py-1 text-xs">
                      {txn.description}
                    </td>
                    <td
                      className={`border border-gray-300 px-2 py-1 text-right font-mono ${
                        txn.amount >= 0 ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      ${Number(txn.amount).toFixed(2)}
                    </td>
                    <td className="border border-gray-300 px-2 py-1 text-right font-mono">
                      ${Number(txn.balance).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Sample Balance Sheet */}
      {sampleBalanceSheet.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
          <h3 className="font-semibold mb-3">
            Sample Balance Sheet Accounts (Q4 2024, First 10)
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 px-2 py-1 text-left">
                    Account Type
                  </th>
                  <th className="border border-gray-300 px-2 py-1 text-left">
                    Account Name
                  </th>
                  <th className="border border-gray-300 px-2 py-1 text-left">
                    Category
                  </th>
                  <th className="border border-gray-300 px-2 py-1 text-right">
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody>
                {sampleBalanceSheet.map((acc, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="border border-gray-300 px-2 py-1">
                      <span
                        className={`text-xs px-2 py-0.5 rounded ${
                          acc.account_type === "asset"
                            ? "bg-green-100 text-green-800"
                            : acc.account_type === "liability"
                            ? "bg-red-100 text-red-800"
                            : "bg-blue-100 text-blue-800"
                        }`}
                      >
                        {acc.account_type}
                      </span>
                    </td>
                    <td className="border border-gray-300 px-2 py-1">
                      {acc.account_name}
                    </td>
                    <td className="border border-gray-300 px-2 py-1">
                      {acc.category || "-"}
                    </td>
                    <td className="border border-gray-300 px-2 py-1 text-right font-mono">
                      ${Number(acc.amount).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SQL Examples */}
      {stats && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="font-semibold mb-2">Try These SQL Queries</h3>
          <div className="space-y-2 text-sm">
            <div className="bg-white p-2 rounded border border-gray-200">
              <strong>Top spending categories:</strong>
              <pre className="text-xs mt-1 overflow-x-auto">
                {`SELECT category, COUNT(*) as count, SUM(-amount) as total
FROM transactions
WHERE amount < 0
GROUP BY category
ORDER BY total DESC`}
              </pre>
            </div>
            <div className="bg-white p-2 rounded border border-gray-200">
              <strong>Balance sheet summary by quarter:</strong>
              <pre className="text-xs mt-1 overflow-x-auto">
                {`SELECT period, totalAssets, totalLiabilities, totalEquity
FROM balance_sheet_summary
ORDER BY date`}
              </pre>
            </div>
            <div className="bg-white p-2 rounded border border-gray-200">
              <strong>Monthly transaction trends:</strong>
              <pre className="text-xs mt-1 overflow-x-auto">
                {`SELECT
  strftime(date, '%Y-%m') as month,
  COUNT(*) as txn_count,
  SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END) as income,
  SUM(CASE WHEN amount < 0 THEN -amount ELSE 0 END) as expenses
FROM transactions
GROUP BY month
ORDER BY month`}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
