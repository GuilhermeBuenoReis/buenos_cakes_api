import type { User } from '../../core/entities/user';
import type {
  UserRepositoryResponse,
  UsersRepository,
} from '../../core/repositories/users-repository';

export class InMemoryUsersRepository implements UsersRepository {
  public items: User[] = [];

  async findById(id: string): Promise<UserRepositoryResponse | null> {
    const user = this.items.find((item) => item.id.toString() === id);

    if (!user) {
      return null;
    }

    return {
      user,
    };
  }

  async findByEmail(email: string): Promise<UserRepositoryResponse | null> {
    const user = this.items.find((item) => item.email === email);

    if (!user) {
      return null;
    }

    return {
      user,
    };
  }

  async create(user: User): Promise<UserRepositoryResponse> {
    this.items.push(user);

    return {
      user,
    };
  }

  async save(user: User): Promise<UserRepositoryResponse> {
    const userIndex = this.items.findIndex((item) => item.id.equals(user.id));

    this.items[userIndex] = user;

    return {
      user,
    };
  }
}
