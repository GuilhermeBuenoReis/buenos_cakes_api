import { type Either, error, success } from '../../../../core/either';
import { UnexpectedError } from '../../../../core/errors/unexpected-error';
import type { HashGenerator } from '../../../cryptography/application/cryptography/hash-generator';
import { User } from '../../enterprise/entities/user';
import { UserAlreadyExistsError } from '../errors/user-already-exists-error';
import type { UsersRepository } from '../repositories/users-repository';

export interface RegisterUserServiceRequest {
  name: string;
  email: string;
  password: string;
}

export type RegisterUserServiceResponse = Either<
  UserAlreadyExistsError | UnexpectedError,
  {
    user: User;
  }
>;

export class RegisterUserService {
  constructor(
    private usersRepository: UsersRepository,
    private hashGenerator: HashGenerator
  ) {}

  async execute({
    name,
    email,
    password,
  }: RegisterUserServiceRequest): Promise<RegisterUserServiceResponse> {
    try {
      const userWithSameEmail = await this.usersRepository.findByEmail(email);

      if (userWithSameEmail) {
        return error(new UserAlreadyExistsError(email));
      }

      const hashedPassword = await this.hashGenerator.hash(password);

      const user = User.create({
        name,
        email,
        password: hashedPassword,
      });

      await this.usersRepository.create(user);

      return success({
        user,
      });
    } catch {
      return error(new UnexpectedError());
    }
  }
}
