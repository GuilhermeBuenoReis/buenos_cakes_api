import type { User } from '../../enterprise/entities/user';
import type { UsersRepository } from '../repositories/users-repository';
import type { HashComparer } from '../../../cryptography/application/cryptography/hash-comparer';
import type { TokenGenerator } from '../../../cryptography/application/cryptography/token-generator';
import { type Either, error, success } from '../../../../core/either';
import { InvalidCredentialsError } from '../errors/invalid-credentials-error';
import { UnexpectedError } from '../../../../core/errors/unexpected-error';

export interface AuthenticateUserServiceRequest {
  email: string;
  password: string;
}

export type AuthenticateUserServiceResponse = Either<
  InvalidCredentialsError | UnexpectedError,
  {
    user: User;
    accessToken: string;
  }
>;

export class AuthenticateUserService {
  constructor(
    private usersRepository: UsersRepository,
    private hashComparer: HashComparer,
    private tokenGenerator: TokenGenerator
  ) {}

  async execute({
    email,
    password,
  }: AuthenticateUserServiceRequest): Promise<AuthenticateUserServiceResponse> {
    try {
      const user = await this.usersRepository.findByEmail(email);

      if (!user) {
        return error(new InvalidCredentialsError());
      }

      const isPasswordValid = await this.hashComparer.compare(
        password,
        user.password
      );

      if (!isPasswordValid) {
        return error(new InvalidCredentialsError());
      }

      const accessToken = await this.tokenGenerator.generate({
        sub: user.id.toString(),
      });

      return success({
        user,
        accessToken,
      });
    } catch {
      return error(new UnexpectedError());
    }
  }
}
