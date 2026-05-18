import { z } from 'zod';

export const envSchema = z.object({
  PORT: z.coerce.number().default(3333),
  DATABASE_URL: z.string(),

  CLIENT_ORIGIN: z.string().default('http://localhost:3000'),
  JWT_SECRET: z.string().optional(),

  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
})
  .superRefine((env, ctx) => {
    if (env.NODE_ENV === 'production' && !env.JWT_SECRET) {
      ctx.addIssue({
        code: 'custom',
        path: ['JWT_SECRET'],
        message: 'JWT_SECRET is required in production.',
      });
    }
  })
  .transform((env) => ({
    ...env,
    JWT_SECRET: env.JWT_SECRET || 'buenos-cakes-api-development-secret',
  }));

export const env = envSchema.parse(process.env);
