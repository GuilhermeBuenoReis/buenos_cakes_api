import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';

export const healthRoute: FastifyPluginAsyncZod = async (app) => {
  app.get(
    '/health',
    {
      schema: {
        operationId: 'healthCheck',
        tags: ['Health'],
        description: 'Health check endpoint',
        response: {
          200: z.object({
            status: z.literal('ok'),
          }),
        },
      },
    },
    async () => ({ status: 'ok' as const })
  );
};
