import scalar from '@scalar/fastify-api-reference';
import type { FastifyPluginAsync } from 'fastify';

export const scalarPlugin: FastifyPluginAsync = async (app) => {
  await app.register(scalar, {
    routePrefix: '/scalar',
    configuration: {
      theme: 'kepler',
    },
  });
};
