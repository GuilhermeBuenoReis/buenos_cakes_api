import type { User } from '../../enterprise/entities/user';

export interface UsersRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  create(user: User): Promise<User>;
  save(user: User): Promise<User>;
  delete(user: User): Promise<void>;
}
