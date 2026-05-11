import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import { env } from '../http/env';
import { schema } from './schema/index';

export const db = drizzle(env.DATABASE_URL, {
  schema,
});
