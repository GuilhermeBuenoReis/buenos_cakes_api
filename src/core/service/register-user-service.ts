import { User } from '../entities/user';
import type { UsersRepository } from '../repositories/users-repository';
import type { HashGenerator } from '../utils/cryptography/hash-generator';
import { type Either, error, success } from '../utils/either';
import { UserAlreadyExistsError } from './errors/user-already-exists-error';

export interface RegisterUserServiceRequest {
  name: string;
  email: string;
  password: string;
}

export type RegisterUserServiceResponse = Either<
  UserAlreadyExistsError,
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
  }
}
