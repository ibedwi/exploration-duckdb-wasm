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

  // Use local bundles from public directory instead of CDN
  const MANUAL_BUNDLES: duckdb.DuckDBBundles = {
    mvp: {
      mainModule: "/duckdb/duckdb-mvp.wasm",
      mainWorker: "/duckdb/duckdb-browser-mvp.worker.js",
    },
    eh: {
      mainModule: "/duckdb/duckdb-eh.wasm",
      mainWorker: "/duckdb/duckdb-browser-eh.worker.js",
    },
  };

  const bundle = await duckdb.selectBundle(MANUAL_BUNDLES);

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
