/* eslint-disable n/no-unpublished-import */
import * as dotenv from 'dotenv';
import { defineConfig } from 'drizzle-kit';

dotenv.config();

const { PGHOST, PGDATABASE, PGUSER, PGPASSWORD, ENDPOINT_ID } = process.env;

if (!PGHOST || !PGDATABASE || !PGUSER || !PGPASSWORD || !ENDPOINT_ID)
  throw new Error('Missing environment variables');

export default defineConfig({
  schema: './src/config/database/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    host: PGHOST,
    user: PGUSER,
    password: PGPASSWORD,
    database: PGDATABASE,
    ssl: true,
  },
});
