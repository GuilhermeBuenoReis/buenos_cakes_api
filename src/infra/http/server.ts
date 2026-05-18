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
import { makeUserGuard } from '@/core/guards/user-guard';
import { DrizzleUsersRepository } from '../db/repositories/drizzle-users-repository';
import { env } from './env';
import { authenticateUserRoute } from './routes/authenticate-user-route';
import { createAddressRoute } from './routes/create-address-route';
import { createUserRoute } from './routes/create-user-route';
import { deleteAddressRoute } from './routes/delete-address-route';
import { deleteUserRoute } from './routes/delete-user-route';
import { fetchAddressByIdRoute } from './routes/fetch-address-by-id-route';
import { fetchUserByIdRoute } from './routes/fetch-user-by-id-route';
import { healthRoute } from './routes/health';
import { listUserAddressesRoute } from './routes/list-user-addresses-route';
import { setDefaultAddressRoute } from './routes/set-default-address-route';
import { updateAddressRoute } from './routes/update-address-route';
import { updateUserRoute } from './routes/update-user-route';

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
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
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

export const userGuard = makeUserGuard({
  usersRepository: new DrizzleUsersRepository(),
  jwtSecret: env.JWT_SECRET,
});

app.register(healthRoute);
app.register(createUserRoute);
app.register(authenticateUserRoute);
app.register(fetchUserByIdRoute);
app.register(updateUserRoute);
app.register(deleteUserRoute);
app.register(createAddressRoute);
app.register(fetchAddressByIdRoute);
app.register(listUserAddressesRoute);
app.register(updateAddressRoute);
app.register(deleteAddressRoute);
app.register(setDefaultAddressRoute);

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
