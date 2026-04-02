import type { UsersRepository } from '../repositories/users-repository';
import { type Either, error, success } from '../utils/either';
import { UnexpectedError } from './errors/unexpected-error';
import { UserNotFoundError } from './errors/user-not-found-error';

export interface DeleteUserServiceRequest {
  userId: string;
}

export type DeleteUserServiceResponse = Either<
  UserNotFoundError | UnexpectedError,
  {
    message: string;
  }
>;

export class DeleteUserService {
  constructor(private usersRepository: UsersRepository) {}

  async execute({
    userId,
  }: DeleteUserServiceRequest): Promise<DeleteUserServiceResponse> {
    try {
      const user = await this.usersRepository.findById(userId);

      if (!user) {
        return error(new UserNotFoundError(userId));
      }

      await this.usersRepository.delete(user);

      return success({
        message: 'User deleted successfully.',
      });
    } catch {
      return error(new UnexpectedError());
    }
  }
}
