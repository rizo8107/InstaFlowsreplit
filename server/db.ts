import 'dotenv/config';
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

const connectionString = process.env.DATABASE_URL!;
// Respect sslmode in the URL for pg client
const ssl = connectionString.includes('sslmode=disable')
  ? false
  : connectionString.includes('sslmode=require')
    ? { rejectUnauthorized: false }
    : undefined;

export const pool = new Pool({ connectionString, ssl });
export const db = drizzle(pool, { schema });
