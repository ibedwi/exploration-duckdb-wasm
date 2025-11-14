import { useEffect, useState } from "react";
import { initializeDuckDB, query } from "~/lib/duckdb/client";

export default function DuckDBTest() {
  const [status, setStatus] = useState<string>("Not initialized");
  const [initialized, setInitialized] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [error, setError] = useState<string>("");
  const [sqlQuery, setSqlQuery] = useState<string>(
    "SELECT * FROM test_data ORDER BY amount DESC"
  );
  const [queryTime, setQueryTime] = useState<number>(0);
  const [columns, setColumns] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    async function init() {
      try {
        setStatus("Initializing DuckDB...");
        await initializeDuckDB();

        setStatus("Creating test table...");
        await query(`
          CREATE TABLE IF NOT EXISTS test_data AS
          SELECT * FROM (VALUES
            (1, 'Alice', 100),
            (2, 'Bob', 200),
            (3, 'Charlie', 300)
          ) AS t(id, name, amount)
        `);

        setStatus("Ready");
        setInitialized(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
        setStatus("Initialization failed");
      }
    }

    init();
  }, []);

  async function executeQuery() {
    if (!sqlQuery.trim()) {
      setError("Please enter a SQL query");
      return;
    }

    try {
      setError("");
      setResults([]);
      setColumns([]);
      setStatus("Executing query...");

      const startTime = performance.now();
      const data = await query<any>(sqlQuery);
      const endTime = performance.now();

      setQueryTime(endTime - startTime);
      setResults(data);

      // Extract column names from first row
      if (data.length > 0) {
        setColumns(Object.keys(data[0]));
      }

      setStatus(`Query completed in ${(endTime - startTime).toFixed(2)}ms`);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setStatus("Query failed");
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    // Execute on Cmd+Enter or Ctrl+Enter
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      executeQuery();
    }
  }

  async function loadTransactionsData() {
    try {
      setStatus("Loading transactions from /data/transactions.json...");
      setError("");

      await query(`
        CREATE OR REPLACE TABLE transactions AS
        SELECT * FROM read_json_auto('/data/transactions.json')
      `);

      const count = await query<{ count: number }>(
        "SELECT COUNT(*) as count FROM transactions"
      );

      setStatus(`✅ Loaded ${count[0].count} transactions successfully!`);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load transactions. Make sure transactions.json exists in public/data/"
      );
      setStatus("Failed to load transactions");
    }
  }

  async function handleFileDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    const jsonFiles = files.filter((f) => f.name.endsWith(".json"));

    if (jsonFiles.length === 0) {
      setError("Please drop a JSON file");
      return;
    }

    const file = jsonFiles[0];
    await loadJSONFile(file);
  }

  async function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    await loadJSONFile(file);
  }

  async function loadJSONFile(file: File) {
    try {
      setStatus(`Loading ${file.name}...`);
      setError("");

      // Read file content
      const text = await file.text();
      const data = JSON.parse(text);

      // Detect if it's transactions or balance sheets
      const isArray = Array.isArray(data);
      if (!isArray) {
        setError("JSON file must contain an array of records");
        return;
      }

      // Infer table name from filename
      const tableName = file.name
        .replace(".json", "")
        .replace(/[^a-zA-Z0-9_]/g, "_");

      // Create table from data
      // Convert JS array to SQL-compatible format
      const sample = data[0];
      if (!sample) {
        setError("JSON file is empty");
        return;
      }

      // Build CREATE TABLE with inferred types
      const columns = Object.keys(sample)
        .map((key) => {
          const value = sample[key];
          let type = "VARCHAR";
          if (typeof value === "number") {
            type = Number.isInteger(value) ? "INTEGER" : "DOUBLE";
          } else if (typeof value === "boolean") {
            type = "BOOLEAN";
          } else if (value && typeof value === "object") {
            type = "JSON";
          }
          return `"${key}" ${type}`;
        })
        .join(", ");

      await query(`DROP TABLE IF EXISTS ${tableName}`);
      await query(`CREATE TABLE ${tableName} (${columns})`);

      // Insert data in batches
      const batchSize = 100;
      let inserted = 0;

      for (let i = 0; i < data.length; i += batchSize) {
        const batch = data.slice(i, i + batchSize);

        const values = batch
          .map((row: any) => {
            const vals = Object.keys(sample)
              .map((key) => {
                const val = row[key];
                if (val === null || val === undefined) return "NULL";
                if (typeof val === "number" || typeof val === "boolean")
                  return String(val);
                if (typeof val === "object") return `'${JSON.stringify(val).replace(/'/g, "''")}'`;
                return `'${String(val).replace(/'/g, "''")}'`;
              })
              .join(", ");
            return `(${vals})`;
          })
          .join(", ");

        await query(`INSERT INTO ${tableName} VALUES ${values}`);
        inserted += batch.length;
        setStatus(`Inserting data... ${inserted}/${data.length} rows`);
      }

      setStatus(`✅ Loaded ${data.length} rows into table "${tableName}"`);

      // Auto-run a SELECT to show the data
      setSqlQuery(`SELECT * FROM ${tableName} LIMIT 10`);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load JSON file. Make sure it's valid JSON."
      );
      setStatus("Failed to load file");
    }
  }

  function handleDragOver(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragging(true);
  }

  function handleDragLeave(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragging(false);
  }

  const exampleQueries = [
    {
      label: "Basic SELECT",
      sql: "SELECT * FROM test_data ORDER BY amount DESC",
    },
    {
      label: "Aggregate",
      sql: "SELECT COUNT(*) as total, SUM(amount) as sum, AVG(amount) as avg FROM test_data",
    },
    {
      label: "Filter",
      sql: "SELECT * FROM test_data WHERE amount > 150",
    },
    {
      label: "Show Tables",
      sql: "SHOW TABLES",
    },
    {
      label: "Table Info",
      sql: "DESCRIBE test_data",
    },
    {
      label: "Load Transactions (from JSON)",
      sql: "CREATE OR REPLACE TABLE transactions AS SELECT * FROM read_json_auto('/data/transactions.json')",
    },
    {
      label: "Count Transactions",
      sql: "SELECT COUNT(*) as total FROM transactions",
    },
    {
      label: "Sample Transactions",
      sql: "SELECT * FROM transactions ORDER BY date DESC LIMIT 10",
    },
    {
      label: "Top Spending Categories",
      sql: "SELECT category, COUNT(*) as count, SUM(-amount) as total_spent FROM transactions WHERE amount < 0 GROUP BY category ORDER BY total_spent DESC",
    },
  ];

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">DuckDB SQL Query Editor</h1>

      {/* Drag & Drop Upload Area */}
      <div
        onDrop={handleFileDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`mb-6 border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          isDragging
            ? "border-blue-500 bg-blue-50"
            : "border-gray-300 bg-gray-50 hover:border-gray-400"
        }`}
      >
        <div className="flex flex-col items-center gap-3">
          <svg
            className="w-12 h-12 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            />
          </svg>
          <div>
            <p className="text-lg font-semibold text-gray-700">
              Drop JSON file here
            </p>
            <p className="text-sm text-gray-500">
              or{" "}
              <label className="text-blue-600 hover:text-blue-700 cursor-pointer underline">
                browse files
                <input
                  type="file"
                  accept=".json"
                  onChange={handleFileInput}
                  className="hidden"
                  disabled={!initialized}
                />
              </label>
            </p>
          </div>
          <div className="text-xs text-gray-500">
            Supports: transactions.json, balance-sheets.json, or any JSON array
          </div>
        </div>
      </div>

      {/* Status Bar */}
      <div
        className={`mb-4 px-4 py-2 rounded-lg border ${
          status === "Ready"
            ? "bg-green-50 border-green-200 text-green-700"
            : status.includes("failed")
            ? "bg-red-50 border-red-200 text-red-700"
            : "bg-blue-50 border-blue-200 text-blue-700"
        }`}
      >
        <strong>Status:</strong> {status}
        {queryTime > 0 && (
          <span className="ml-4">
            <strong>Execution Time:</strong> {queryTime.toFixed(2)}ms
          </span>
        )}
        {results.length > 0 && (
          <span className="ml-4">
            <strong>Rows:</strong> {results.length}
          </span>
        )}
      </div>

      {/* Query Editor */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <label className="font-semibold text-lg">SQL Query</label>
          <span className="text-sm text-gray-600">
            Press <kbd className="px-2 py-1 bg-gray-200 rounded">Cmd+Enter</kbd> or{" "}
            <kbd className="px-2 py-1 bg-gray-200 rounded">Ctrl+Enter</kbd> to execute
          </span>
        </div>
        <textarea
          value={sqlQuery}
          onChange={(e) => setSqlQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          className="w-full h-32 p-3 font-mono text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Enter your SQL query here..."
          disabled={!initialized}
        />
        <div className="flex gap-2 mt-2">
          <button
            onClick={executeQuery}
            disabled={!initialized}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            Execute Query
          </button>
          <button
            onClick={loadTransactionsData}
            disabled={!initialized}
            className="bg-green-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            Load Transactions
          </button>
          <button
            onClick={() => {
              setSqlQuery("");
              setResults([]);
              setError("");
            }}
            className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg font-semibold hover:bg-gray-400 transition"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Example Queries */}
      <div className="mb-6">
        <h3 className="font-semibold mb-2">Example Queries:</h3>
        <div className="flex flex-wrap gap-2">
          {exampleQueries.map((example) => (
            <button
              key={example.label}
              onClick={() => setSqlQuery(example.sql)}
              className="text-sm bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded border border-gray-300 transition"
            >
              {example.label}
            </button>
          ))}
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-300 rounded-lg p-4 mb-6">
          <div className="flex items-start">
            <span className="text-red-600 font-bold mr-2">Error:</span>
            <pre className="text-sm text-red-800 whitespace-pre-wrap flex-1">
              {error}
            </pre>
          </div>
        </div>
      )}

      {/* Results Table */}
      {results.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
            <h2 className="font-semibold">
              Results ({results.length} row{results.length !== 1 ? "s" : ""})
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  {columns.map((col) => (
                    <th
                      key={col}
                      className="border border-gray-300 px-4 py-2 text-left font-semibold"
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {results.map((row, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    {columns.map((col) => (
                      <td
                        key={col}
                        className="border border-gray-300 px-4 py-2 font-mono text-sm"
                      >
                        {row[col] === null
                          ? "NULL"
                          : typeof row[col] === "object"
                          ? JSON.stringify(row[col])
                          : String(row[col])}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!error && results.length === 0 && initialized && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center text-gray-600">
          <p className="text-lg mb-2">No results to display</p>
          <p className="text-sm">
            Enter a SQL query above and click "Execute Query" or press Cmd+Enter
          </p>
        </div>
      )}

      {/* Help Section */}
      <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h3 className="font-semibold mb-2">💡 Tips</h3>
        <ul className="text-sm space-y-1 list-disc list-inside">
          <li>The <code className="bg-yellow-100 px-1 rounded">test_data</code> table is pre-loaded with sample data</li>
          <li>Use <code className="bg-yellow-100 px-1 rounded">SHOW TABLES</code> to see all available tables</li>
          <li>Use <code className="bg-yellow-100 px-1 rounded">DESCRIBE table_name</code> to see table schema</li>
          <li>DuckDB supports most PostgreSQL syntax</li>
          <li>Visit <a href="/load-data" className="text-blue-600 hover:underline">/load-data</a> to load transaction and balance sheet data</li>
        </ul>
      </div>
    </div>
  );
}
