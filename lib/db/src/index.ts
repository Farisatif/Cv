import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

const supabaseUrl = process.env.SUPABASE_DATABASE_URL;
const localUrl = process.env.DATABASE_URL;

const isSupabase = Boolean(supabaseUrl);
const connectionString = isSupabase ? supabaseUrl : localUrl;

if (!connectionString) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

export const pool = new Pool({ 
  connectionString,
  ssl: isSupabase ? { rejectUnauthorized: false } : false,
});

export const db = drizzle(pool, { schema });

export * from "./schema";
