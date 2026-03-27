import { User } from '../../core/entities/user';
import type { UsersRepository } from '../../core/repositories/users-repository';

export class InMemoryUsersRepository implements UsersRepository {
  public items: User[] = [];

  async findById(id: string): Promise<User | null> {
    const user = this.items.find((item) => item.id.toString() === id);

    return user ?? null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const user = this.items.find((item) => item.email === email);

    return user ?? null;
  }

  async create(user: User): Promise<void> {
    this.items.push(user);
  }

  async save(user: User): Promise<void> {
    const userIndex = this.items.findIndex((item) => item.id.equals(user.id));

    this.items[userIndex] = user;
  }
}
