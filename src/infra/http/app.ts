import fastify from 'fastify';
import {
  serializerCompiler,
  validatorCompiler,
  type ZodTypeProvider,
} from 'fastify-type-provider-zod';
import { cookiePlugin } from './plugins/cookie';
import { corsPlugin } from './plugins/cors';
import { scalarPlugin } from './plugins/scalar';
import { swaggerPlugin } from './plugins/swagger';
import { healthRoute } from './routes/health';

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
