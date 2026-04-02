import type { User } from '../entities/user';
import type { UsersRepository } from '../repositories/users-repository';
import { type Either, error, success } from '../utils/either';
import { UnexpectedError } from './errors/unexpected-error';
import { UserNotFoundError } from './errors/user-not-found-error';

export interface GetUserByIdServiceRequest {
  userId: string;
}

export type GetUserByIdServiceResponse = Either<
  UserNotFoundError | UnexpectedError,
  {
    user: User;
  }
>;

export class GetUserByIdService {
  constructor(private usersRepository: UsersRepository) {}

  async execute({
    userId,
  }: GetUserByIdServiceRequest): Promise<GetUserByIdServiceResponse> {
    try {
      const user = await this.usersRepository.findById(userId);

      if (!user) {
        return error(new UserNotFoundError(userId));
      }

      return success({
        user,
      });
    } catch {
      return error(new UnexpectedError());
    }
  }
}
