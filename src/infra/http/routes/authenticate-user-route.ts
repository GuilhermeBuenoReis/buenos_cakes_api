import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';

import { UnexpectedError } from '@/core/errors/unexpected-error';
import { InvalidCredentialsError } from '@/domain/users/application/errors/invalid-credentials-error';
import { AuthenticateUserService } from '@/domain/users/application/services/authenticate-user-service';
import { BcryptHasher } from '@/infra/cryptography/bcrypt-hasher';
import { JoseTokenGenerator } from '@/infra/cryptography/jose-token-generator';
import { DrizzleUsersRepository } from '@/infra/db/repositories/drizzle-users-repository';
import { env } from '@/infra/http/env';
import { UserPresenter } from '@/infra/presenters/user-presenter';

export const authenticateUserRoute: FastifyPluginAsyncZod = async (app) => {
  app.post(
    '/api/users/login',
    {
      schema: {
        summary: 'Authenticate user',
        operationId: 'authenticateUser',
        tags: ['Users'],
        body: z.object({
          email: z.email(),
          password: z.string().min(1),
        }),
        response: {
          200: z.object({
            user: z.object({
              id: z.string(),
              name: z.string(),
              email: z.email(),
              cpf: z.string().nullable().optional(),
              phone: z.string().nullable().optional(),
              role: z.enum(['customer', 'admin']),
              createdAt: z.iso.datetime(),
              updatedAt: z.iso.datetime().nullable().optional(),
            }),
            accessToken: z.string(),
          }),
          400: z.object({ message: z.string() }),
          401: z.object({ message: z.string() }),
          500: z.object({ message: z.string() }),
        },
      },
    },
    async (request, reply) => {
      const usersRepository = new DrizzleUsersRepository();
      const hashComparer = new BcryptHasher();
      const tokenGenerator = new JoseTokenGenerator();

      const authenticateUserService = new AuthenticateUserService(
        usersRepository,
        hashComparer,
        tokenGenerator
      );

      try {
        const { email, password } = request.body;

        const result = await authenticateUserService.execute({
          email,
          password,
        });

        if (result.isError()) {
          const error = result.value;

          if (error instanceof InvalidCredentialsError) {
            return reply.status(401).send({ message: error.message });
          }

          if (error instanceof UnexpectedError) {
            return reply.status(500).send({ message: error.message });
          }

          return reply.status(400).send({ message: 'Bad request' });
        }

        const { user, accessToken } = result.value;

        reply.setCookie('accessToken', accessToken, {
          path: '/',
          httpOnly: true,
          sameSite: 'lax',
          secure: env.NODE_ENV === 'development',
          maxAge: 60 * 60 * 24 * 7,
        });

        return reply.status(200).send({
          user: UserPresenter.toHTTP(user),
          accessToken,
        });
      } catch (error) {
        request.log.error(error);
        return reply.status(500).send({ message: 'Internal server error' });
      }
    }
  );
};
