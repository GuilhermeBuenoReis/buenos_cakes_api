import fastifyCookie from '@fastify/cookie';
import type { FastifyPluginAsync } from 'fastify';

export const cookiePlugin: FastifyPluginAsync = async (app) => {
  await app.register(fastifyCookie, {
    hook: 'onRequest',
  });
};
