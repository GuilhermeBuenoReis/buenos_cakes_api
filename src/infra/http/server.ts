import { randomUUID } from 'node:crypto';
import { writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import fastifyCookie from '@fastify/cookie';
import fastifyCors from '@fastify/cors';
import fastifySwagger from '@fastify/swagger';
import scalar from '@scalar/fastify-api-reference';
import fastify from 'fastify';
import {
  jsonSchemaTransform,
  serializerCompiler,
  validatorCompiler,
  type ZodTypeProvider,
} from 'fastify-type-provider-zod';
import { env } from './env';
import { createUserRoute } from './routes/create-user-route';
import { healthRoute } from './routes/health';

export const app = fastify().withTypeProvider<ZodTypeProvider>();

app.setValidatorCompiler(validatorCompiler);
app.setSerializerCompiler(serializerCompiler);

app.register(fastifySwagger, {
  openapi: {
    info: { title: 'Buenos_Cakes', version: '1.0.0' },
    servers: [{ url: `http://localhost:${env.PORT}` }],
  },
  transform: jsonSchemaTransform,
});

app.register(fastifyCookie, {
  hook: 'onRequest',
});

app.register(fastifyCors, {
  origin: env.CLIENT_ORIGIN,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true,
  maxAge: 86_400,
});

app.register(scalar, {
  routePrefix: '/scalar',
  configuration: {
    theme: 'kepler',
  },
});

app.register(healthRoute);
app.register(createUserRoute);

app.listen({ port: env.PORT, host: '0.0.0.0' }).then(() => {
  console.log(
    `Server is running on url http://localhost:${env.PORT} | Visit http://localhost:${env.PORT}/scalar to view the documentation.`
  );
});

if (env.NODE_ENV === 'development') {
  const specFile = resolve(__dirname, '../../../swagger.json');
  app.ready().then(async () => {
    const spec = JSON.stringify(app.swagger(), null, 2);
    await writeFile(specFile, spec);
    console.log('Swagger spec generated!');
    console.log(randomUUID());
  });
}
