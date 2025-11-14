import { useState } from "react";
import { generateAllData, dataToJSON } from "~/lib/data/generators/generate-all";
import type { Transaction, BalanceSheet } from "~/lib/data/types";

export default function GenerateData() {
  const [generated, setGenerated] = useState(false);
  const [data, setData] = useState<{
    transactions: Transaction[];
    balanceSheets: BalanceSheet[];
    summary: any;
  } | null>(null);

  function handleGenerate() {
    const generatedData = generateAllData();
    setData(generatedData);
    setGenerated(true);
  }

  function downloadJSON(data: any, filename: string) {
    const jsonStr = dataToJSON(data);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Generate Financial Data</h1>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <p className="text-sm mb-2">
          This tool generates realistic sample financial data including:
        </p>
        <ul className="text-sm list-disc list-inside space-y-1">
          <li>10,000 bank transactions over the past year</li>
          <li>12 categories: groceries, dining, shopping, utilities, rent, transportation, entertainment, healthcare, subscriptions, travel, salary, and freelance</li>
          <li>100+ unique merchants with realistic names</li>
          <li>4 quarterly balance sheets for 2024</li>
          <li>Proper accounting equation (Assets = Liabilities + Equity)</li>
        </ul>
      </div>

      {!generated ? (
        <button
          onClick={handleGenerate}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
        >
          Generate Data
        </button>
      ) : (
        <div className="space-y-6">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h2 className="font-semibold text-lg mb-2">✓ Data Generated Successfully!</h2>
            {data && (
              <div className="text-sm space-y-1">
                <p>
                  <strong>Transactions:</strong> {data.summary.transactionCount} records
                </p>
                <p>
                  <strong>Date Range:</strong> {data.summary.dateRange.transactions.start} to{" "}
                  {data.summary.dateRange.transactions.end}
                </p>
                <p>
                  <strong>Balance Sheets:</strong> {data.summary.balanceSheetCount} quarters
                </p>
                <p>
                  <strong>Periods:</strong> {data.summary.dateRange.balanceSheets.start} to{" "}
                  {data.summary.dateRange.balanceSheets.end}
                </p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold mb-2">Bank Transactions</h3>
              <p className="text-sm text-gray-600 mb-3">
                {data?.transactions.length} transactions with categories like groceries,
                utilities, salary, etc.
              </p>
              <button
                onClick={() => downloadJSON(data?.transactions, "transactions.json")}
                className="bg-green-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-green-700 transition w-full"
              >
                Download transactions.json
              </button>
            </div>

            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold mb-2">Balance Sheets</h3>
              <p className="text-sm text-gray-600 mb-3">
                {data?.balanceSheets.length} quarterly balance sheets with assets,
                liabilities, and equity.
              </p>
              <button
                onClick={() => downloadJSON(data?.balanceSheets, "balance-sheets.json")}
                className="bg-green-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-green-700 transition w-full"
              >
                Download balance-sheets.json
              </button>
            </div>
          </div>

          {/* Preview Section */}
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="font-semibold mb-3">Sample Transaction Preview (First 5)</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-300 px-2 py-1 text-left">Date</th>
                    <th className="border border-gray-300 px-2 py-1 text-left">
                      Merchant
                    </th>
                    <th className="border border-gray-300 px-2 py-1 text-left">
                      Category
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
                  {data?.transactions.slice(0, 5).map((txn) => (
                    <tr key={txn.id} className="hover:bg-gray-50">
                      <td className="border border-gray-300 px-2 py-1">{txn.date}</td>
                      <td className="border border-gray-300 px-2 py-1">{txn.merchant}</td>
                      <td className="border border-gray-300 px-2 py-1">
                        <span className="text-xs bg-gray-200 px-2 py-0.5 rounded">
                          {txn.category}
                        </span>
                      </td>
                      <td
                        className={`border border-gray-300 px-2 py-1 text-right font-mono ${
                          txn.amount >= 0 ? "text-green-600" : "text-red-600"
                        }`}
                      >
                        ${txn.amount.toFixed(2)}
                      </td>
                      <td className="border border-gray-300 px-2 py-1 text-right font-mono">
                        ${txn.balance.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="font-semibold mb-3">Balance Sheet Preview (Latest Quarter)</h3>
            {data?.balanceSheets.slice(-1).map((bs) => (
              <div key={bs.period} className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="font-medium">{bs.period}</span>
                  <span className="text-sm text-gray-600">{bs.date}</span>
                </div>

                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <h4 className="font-semibold mb-1">Assets</h4>
                    <div className="space-y-0.5 text-xs">
                      {bs.assets.slice(0, 3).map((asset) => (
                        <div key={asset.name} className="flex justify-between">
                          <span className="text-gray-600">{asset.name}</span>
                          <span className="font-mono">${asset.amount.toLocaleString()}</span>
                        </div>
                      ))}
                      <div className="border-t pt-0.5 font-semibold flex justify-between">
                        <span>Total</span>
                        <span className="font-mono">${bs.totalAssets.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-1">Liabilities</h4>
                    <div className="space-y-0.5 text-xs">
                      {bs.liabilities.slice(0, 3).map((liability) => (
                        <div key={liability.name} className="flex justify-between">
                          <span className="text-gray-600">{liability.name}</span>
                          <span className="font-mono">
                            ${liability.amount.toLocaleString()}
                          </span>
                        </div>
                      ))}
                      <div className="border-t pt-0.5 font-semibold flex justify-between">
                        <span>Total</span>
                        <span className="font-mono">
                          ${bs.totalLiabilities.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-1">Equity</h4>
                    <div className="space-y-0.5 text-xs">
                      {bs.equity.map((eq) => (
                        <div key={eq.name} className="flex justify-between">
                          <span className="text-gray-600">{eq.name}</span>
                          <span className="font-mono">${eq.amount.toLocaleString()}</span>
                        </div>
                      ))}
                      <div className="border-t pt-0.5 font-semibold flex justify-between">
                        <span>Total</span>
                        <span className="font-mono">${bs.totalEquity.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 p-2 rounded text-xs">
                  <strong>Verification:</strong> Assets ({bs.totalAssets.toLocaleString()}) =
                  Liabilities ({bs.totalLiabilities.toLocaleString()}) + Equity (
                  {bs.totalEquity.toLocaleString()}) ={" "}
                  <span className="text-green-600 font-semibold">
                    {bs.totalLiabilities + bs.totalEquity === bs.totalAssets ? "✓ Balanced" : "✗ Not Balanced"}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h3 className="font-semibold mb-2">Next Steps</h3>
            <ol className="text-sm space-y-1 list-decimal list-inside">
              <li>Download the JSON files using the buttons above</li>
              <li>
                Save them to <code className="bg-gray-200 px-1 rounded">public/data/</code>{" "}
                directory
              </li>
              <li>Use DuckDB WASM to query and analyze the data</li>
              <li>Build visualizations and dashboards</li>
            </ol>
          </div>
        </div>
      )}
    </div>
  );
}
