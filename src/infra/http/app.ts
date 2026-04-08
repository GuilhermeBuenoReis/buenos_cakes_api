import fastify from 'fastify';
import {
  serializerCompiler,
  validatorCompiler,
  type ZodTypeProvider,
} from 'fastify-type-provider-zod';
import { healthRoute } from './routes/health';
import { cookiePlugin } from './plugins/cookie';
import { corsPlugin } from './plugins/cors';
import { scalarPlugin } from './plugins/scalar';
import { swaggerPlugin } from './plugins/swagger';

export function buildApp() {
  const app = fastify().withTypeProvider<ZodTypeProvider>();

  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);

  app.register(cookiePlugin);
  app.register(corsPlugin);
  app.register(swaggerPlugin);
  app.register(scalarPlugin);

  app.register(healthRoute);

  return app;
}

export const app = buildApp();
