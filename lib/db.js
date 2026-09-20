import { Pool } from 'pg';

const globalForDb = globalThis;

export const db = globalForDb.kidShieldDb ?? new Pool({
  connectionString: process.env.SUPABASE_DB_URL,
  ssl: { rejectUnauthorized: false },
  max: 3,
});

if (process.env.NODE_ENV !== 'production') globalForDb.kidShieldDb = db;
