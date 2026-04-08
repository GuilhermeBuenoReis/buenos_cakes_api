import fastifySwagger from '@fastify/swagger';
import type { FastifyPluginAsync } from 'fastify';
import { jsonSchemaTransform } from 'fastify-type-provider-zod';
import { env } from '../env';

export const swaggerPlugin: FastifyPluginAsync = async (app) => {
  await app.register(fastifySwagger, {
    openapi: {
      info: { title: 'Buenos_Cakes', version: '1.0.0' },
      servers: [{ url: `http://localhost:${env.PORT}` }],
    },
    transform: jsonSchemaTransform,
  });
};
