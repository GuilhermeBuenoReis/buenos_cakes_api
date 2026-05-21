import type { FastifyReply, FastifyRequest } from 'fastify';
import { jwtVerify } from 'jose';

import type { UsersRepository } from '@/domain/users/application/repositories/users-repository';
import { DrizzleUsersRepository } from '@/infra/db/repositories/drizzle-users-repository';
import { env } from '../env';

interface MakeUserAuthMiddlewareParams {
  usersRepository: UsersRepository;
  jwtSecret: string;
}

function extractTokenFromRequest(request: FastifyRequest) {
  const authorization = request.headers.authorization;

  if (authorization?.startsWith('Bearer ')) {
    return authorization.replace('Bearer ', '');
  }

  return request.cookies.accessToken;
}

export function makeUserAuthMiddleware({
  usersRepository,
  jwtSecret,
}: MakeUserAuthMiddlewareParams) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const token = extractTokenFromRequest(request);

    if (!token) {
      return reply.status(401).send({ message: 'Unauthorized.' });
    }

    try {
      const secret = new TextEncoder().encode(jwtSecret);
      const { payload } = await jwtVerify(token, secret);

      if (!payload.sub) {
        return reply.status(401).send({ message: 'Unauthorized.' });
      }

      const user = await usersRepository.findById(payload.sub);

      if (!user) {
        return reply.status(401).send({ message: 'Unauthorized.' });
      }

      request.user = {
        id: user.id.toString(),
      };
    } catch (error) {
      request.log.error(error);
      return reply.status(401).send({ message: 'Unauthorized.' });
    }
  };
}

export const userAuthMiddleware = makeUserAuthMiddleware({
  usersRepository: new DrizzleUsersRepository(),
  jwtSecret: env.JWT_SECRET,
});
