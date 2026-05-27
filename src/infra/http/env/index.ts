import { z } from 'zod';

export const envSchema = z.object({
  PORT: z.coerce.number().default(3333),
  DATABASE_URL: z.string(),

  CLIENT_ORIGIN: z.string().default('http://localhost:3000'),
  JWT_SECRET: z.string().optional(),
  ABACATE_PAY_API_KEY: z.string().optional(),
  ABACATE_PAY_WEBHOOK_PUBLIC_KEY: z
    .string()
    .default(
      't9dXRhHHo3yDEj5pVDYz0frf7q6bMKyMRmxxCPIPp3RCplBfXRxqlC6ZpiWmOqj4L63qEaeUOtrCI8P0VMUgo6iIga2ri9ogaHFs0WIIywSMg0q7RmBfybe1E5XJcfC4IW3alNqym0tXoAKkzvfEjZxV6bE0oG2zJrNNYmUCKZyV0KZ3JS8Votf9EAWWYdiDkMkpbMdPggfh1EqHlVkMiTady6jOR3hyzGEHrIz2Ret0xHKMbiqkr9HS1JhNHDX9'
    ),
  ABACATE_PAY_BASE_URL: z
    .string()
    .default('https://api.abacatepay.com/v2'),
  ABACATE_PAY_RETURN_URL: z.string().optional(),
  ABACATE_PAY_COMPLETION_URL: z.string().optional(),

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
    ABACATE_PAY_RETURN_URL:
      env.ABACATE_PAY_RETURN_URL ?? `${env.CLIENT_ORIGIN}/checkout`,
    ABACATE_PAY_COMPLETION_URL:
      env.ABACATE_PAY_COMPLETION_URL ??
      `${env.CLIENT_ORIGIN}/checkout/success`,
  }));

export const env = envSchema.parse(process.env);
