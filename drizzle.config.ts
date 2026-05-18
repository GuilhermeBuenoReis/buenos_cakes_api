import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';
import { env } from './src/infra/http/env/';

export default defineConfig({
  out: './drizzle',
  schema: './src/infra/db/schema/index.ts',
  dialect: 'postgresql',
  dbCredentials: {
    url: env.DATABASE_URL,
  },
});
