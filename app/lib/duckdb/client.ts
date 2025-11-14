import * as duckdb from "@duckdb/duckdb-wasm";
import type { AsyncDuckDB, AsyncDuckDBConnection } from "@duckdb/duckdb-wasm";
import { Table } from "apache-arrow";

// Singleton
let db: AsyncDuckDB | null = null;
let connection: AsyncDuckDBConnection | null = null;

export async function initializeDuckDB() {
  if (db) {
    return db;
  }

  // IMPORTANT: For Vercel deployment, we need to use unpkg.com instead of jsdelivr
  // because unpkg has better CORS support for Web Workers
  const UNPKG_BUNDLES: duckdb.DuckDBBundles = {
    mvp: {
      mainModule: "https://unpkg.com/@duckdb/duckdb-wasm@1.30.0/dist/duckdb-mvp.wasm",
      mainWorker: "https://unpkg.com/@duckdb/duckdb-wasm@1.30.0/dist/duckdb-browser-mvp.worker.js",
    },
    eh: {
      mainModule: "https://unpkg.com/@duckdb/duckdb-wasm@1.30.0/dist/duckdb-eh.wasm",
      mainWorker: "https://unpkg.com/@duckdb/duckdb-wasm@1.30.0/dist/duckdb-browser-eh.worker.js",
    },
  };

  let bundles: duckdb.DuckDBBundles;

  // Environment-based bundle selection
  if (import.meta.env.DEV) {
    // Development: Use local bundles (no CORS issues, works offline)
    bundles = {
      mvp: {
        mainModule: "/duckdb/duckdb-mvp.wasm",
        mainWorker: "/duckdb/duckdb-browser-mvp.worker.js",
      },
      eh: {
        mainModule: "/duckdb/duckdb-eh.wasm",
        mainWorker: "/duckdb/duckdb-browser-eh.worker.js",
      },
    };
  } else {
    // Production: Use unpkg CDN (better CORS support than jsdelivr)
    bundles = UNPKG_BUNDLES;
  }

  const bundle = await duckdb.selectBundle(bundles);
  const worker = new Worker(bundle.mainWorker!, { type: "module" });
  const logger = new duckdb.ConsoleLogger();

  db = new duckdb.AsyncDuckDB(logger, worker);
  await db.instantiate(bundle.mainModule);

  return db;
}

export async function getConnection(): Promise<AsyncDuckDBConnection> {
  if (connection) {
    return connection;
  }

  const database = await initializeDuckDB();
  connection = await database.connect();

  return connection;
}

export async function closeConnection(): Promise<void> {
  if (connection) {
    await connection.close();
    connection = null;
  }
}

export async function resetDatabase(): Promise<void> {
  await closeConnection();

  if (db) {
    await db.terminate();
    db = null;
  }
}

export async function query<T = any>(
  sql: string,
  params?: any[]
): Promise<T[]> {
  const conn = await getConnection();

  // Execute query and get arrow tabele result;
  const arrowResult = await conn.query(sql);

  return arrowResultToObjects<T>(arrowResult);
}

function arrowResultToObjects<T>(table: Table): T[] {
  const rows: T[] = [];

  // Iterate over each row in the Arrow table
  for (let i = 0; i < table.numRows; i++) {
    const row: any = {};

    // Extract each column value for this row
    for (const field of table.schema.fields) {
      const column = table.getChild(field.name);
      row[field.name] = column?.get(i);
    }

    rows.push(row as T);
  }

  return rows;
}
