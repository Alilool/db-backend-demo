import { Pool } from "pg";

declare global {
  // Reuse the pool during Next.js hot reloads in development.
  var postgresPool: Pool | undefined;
}

function getConnectionString() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error(
      "DATABASE_URL is missing. Copy .env.example to .env.local and restart the dev server.",
    );
  }

  return connectionString;
}

export function getPool() {
  if (!global.postgresPool) {
    global.postgresPool = new Pool({
      connectionString: getConnectionString(),
      max: 10,
    });
  }

  return global.postgresPool;
}

let schemaReady: Promise<void> | undefined;

export async function ensureSchema() {
  schemaReady ??= getPool()
    .query(`
      CREATE TABLE IF NOT EXISTS demo_tasks (
        id SERIAL PRIMARY KEY,
        title VARCHAR(160) NOT NULL CHECK (char_length(trim(title)) > 0),
        completed BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `)
    .then(() => undefined)
    .catch((error) => {
      schemaReady = undefined;
      throw error;
    });

  return schemaReady;
}
