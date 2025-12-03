import { Pool } from "pg";

declare global {
  var __pgPool: Pool | undefined;
  var __dbIsInit: boolean | undefined;
}

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error(
    "DATABASE_URL is not set. Add it to your environment or .env.local file."
  );
}

const pool = global.__pgPool ?? new Pool({ connectionString });

if (process.env.NODE_ENV !== "production") {
  global.__pgPool = pool;
}

let hasInitialized = global.__dbIsInit ?? false;

export const ensureDatabase = async () => {
  if (hasInitialized) {
    return;
  }

  await pool.query(`
    CREATE TABLE IF NOT EXISTS todos (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      completed BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  hasInitialized = true;
  if (process.env.NODE_ENV !== "production") {
    global.__dbIsInit = true;
  }
};

export default pool;

