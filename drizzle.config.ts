import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';
import { env } from './src/http/env';

export default defineConfig({
  out: './drizzle',
  schema: './src/infra/db/drizzle/schema/index.ts',
  dialect: 'postgresql',
  dbCredentials: {
    url: env.DATABASE_URL,
  },
});
