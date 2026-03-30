import type { User } from '../entities/user';

export interface UserRepositoryResponse {
  user: User;
}

export interface UsersRepository {
  findById(id: string): Promise<UserRepositoryResponse | null>;
  findByEmail(email: string): Promise<UserRepositoryResponse | null>;
  create(user: User): Promise<UserRepositoryResponse>;
  save(user: User): Promise<UserRepositoryResponse>;
}
