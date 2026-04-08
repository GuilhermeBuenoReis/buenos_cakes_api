import type { User } from '../../enterprise/entities/user';
import type { UsersRepository } from '../repositories/users-repository';
import { type Either, error, success } from '../../../../core/either';
import { UnexpectedError } from '../../../../core/errors/unexpected-error';
import { UserNotFoundError } from '../errors/user-not-found-error';

export interface FetchUserByIdServiceRequest {
  userId: string;
}

export type FetchUserByIdServiceResponse = Either<
  UserNotFoundError | UnexpectedError,
  {
    user: User;
  }
>;

export class FetchUserByIdService {
  constructor(private usersRepository: UsersRepository) {}

  async execute({
    userId,
  }: FetchUserByIdServiceRequest): Promise<FetchUserByIdServiceResponse> {
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
