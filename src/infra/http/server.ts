import { randomUUID } from 'node:crypto';
import { writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { app } from './app';
import { env } from './env';

async function startServer() {
  await app.listen({ port: env.PORT, host: '0.0.0.0' });

  console.log(
    `Server is running on url http://localhost:${env.PORT} | Visit http://localhost:${env.PORT}/scalar to view the documentation.`
  );

  if (env.NODE_ENV === 'development') {
    const specFile = resolve(__dirname, '../../../swagger.json');

    await app.ready();

    const spec = JSON.stringify(app.swagger(), null, 2);
    await writeFile(specFile, spec);

    console.log('Swagger spec generated!');
    console.log(randomUUID());
  }
}

startServer();
