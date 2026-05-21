import { type Either, error, success } from '../../../../core/either';
import { UnexpectedError } from '../../../../core/errors/unexpected-error';
import type { User } from '../../enterprise/entities/user';
import { UserAlreadyExistsError } from '../errors/user-already-exists-error';
import { UserNotFoundError } from '../errors/user-not-found-error';
import type { UsersRepository } from '../repositories/users-repository';

export interface UpdateUserServiceRequest {
  userId: string;
  name?: string;
  email?: string;
  cpf?: string | null;
  phone?: string | null;
}

export type UpdateUserServiceResponse = Either<
  UserNotFoundError | UserAlreadyExistsError | UnexpectedError,
  {
    user: User;
  }
>;

export class UpdateUserService {
  constructor(private usersRepository: UsersRepository) {}

  async execute({
    userId,
    name,
    email,
    cpf,
    phone,
  }: UpdateUserServiceRequest): Promise<UpdateUserServiceResponse> {
    try {
      const user = await this.usersRepository.findById(userId);

      if (!user) {
        return error(new UserNotFoundError(userId));
      }

      const isEmailBeingChanged = email && email !== user.email;

      if (isEmailBeingChanged) {
        const userWithSameEmail = await this.usersRepository.findByEmail(email);

        const emailAlreadyInUseByAnotherUser =
          userWithSameEmail && !userWithSameEmail.id.equals(user.id);

        if (emailAlreadyInUseByAnotherUser) {
          return error(new UserAlreadyExistsError(email));
        }
      }

      const fieldsToUpdate = {
        name,
        email,
        cpf,
        phone,
      };

      if (fieldsToUpdate.name !== undefined) user.name = fieldsToUpdate.name;
      if (fieldsToUpdate.email !== undefined) user.email = fieldsToUpdate.email;
      if (fieldsToUpdate.cpf !== undefined) user.cpf = fieldsToUpdate.cpf;
      if (fieldsToUpdate.phone !== undefined) user.phone = fieldsToUpdate.phone;

      await this.usersRepository.save(user);

      return success({
        user,
      });
    } catch {
      return error(new UnexpectedError());
    }
  }
}
