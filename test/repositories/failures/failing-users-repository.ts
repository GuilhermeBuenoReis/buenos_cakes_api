import type { User } from '../../../domain/users/enterprise/entities/user';
import type { UsersRepository } from '../../../domain/users/application/repositories/users-repository';

export class FailingUsersRepository implements UsersRepository {
  async findById(_id: string): Promise<User | null> {
    throw new Error('Unexpected repository error.');
  }

  async findByEmail(_email: string): Promise<User | null> {
    throw new Error('Unexpected repository error.');
  }

  async create(_user: User): Promise<User> {
    throw new Error('Unexpected repository error.');
  }

  async save(_user: User): Promise<User> {
    throw new Error('Unexpected repository error.');
  }

  async delete(_user: User): Promise<void> {
    throw new Error('Unexpected repository error.');
  }
}
