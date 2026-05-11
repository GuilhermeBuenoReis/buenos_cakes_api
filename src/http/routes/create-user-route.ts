import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { UserAlreadyExistsError } from '@/core/service/errors/user-already-exists-error';
import { UnexpectedError } from '@/core/service/errors/unexpected-error';
import { RegisterUserService } from '@/core/service/register-user-service';
import { BcryptHasher } from '@/infra/cryptography/bcrypt-hasher';
import { DrizzleUsersRepository } from '@/infra/db/drizzle/repositories/drizzle-users-repository';
import { UserPresenter } from '@/infra/presenters/user-presenter';

export const createUserRoute: FastifyPluginAsyncZod = async (app) => {
  app.post(
    '/api/users/create',
    {
      schema: {
        summary: 'Create a user',
        operationId: 'createUser',
        tags: ['Users'],
        body: z.object({
          name: z.string().min(1),
          email: z.email(),
          password: z.string().min(8),
        }),
        response: {
          201: z.object({
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
          }),
          400: z.object({ message: z.string() }),
          409: z.object({ message: z.string() }),
          500: z.object({ message: z.string() }),
        },
      },
    },
    async (request, reply) => {
      const usersRepository = new DrizzleUsersRepository();
      const hashGenerator = new BcryptHasher();

      const registerUserService = new RegisterUserService(
        usersRepository,
        hashGenerator
      );

      try {
        const { name, email, password } = request.body;

        const result = await registerUserService.execute({
          name,
          email,
          password,
        });

        if (result.isError()) {
          const error = result.value;

          if (error instanceof UserAlreadyExistsError) {
            return reply.status(409).send({ message: error.message });
          }

          if (error instanceof UnexpectedError) {
            return reply.status(500).send({ message: error.message });
          }

          return reply.status(400).send({ message: 'Bad request' });
        }

        const { user } = result.value;

        return reply.status(201).send({
          user: UserPresenter.toHTTP(user),
        });
      } catch (error) {
        request.log.error(error);
        return reply.status(500).send({ message: 'Internal server error' });
      }
    }
  );
};
