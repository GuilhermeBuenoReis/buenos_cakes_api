import type { User } from '@/core/entities/user';
import type { UsersRepository } from '@/core/repositories/users-repository';
import { UserPresenter } from '@/infra/presenters/user-presenter';
import { eq } from 'drizzle-orm';
import { db } from '../../database';
import { users } from '../schema';

export class DrizzleUsersRepository implements UsersRepository {
  async findById(_id: string): Promise<User | null> {
    throw new Error('Method not implemented.');
  }

  async findByEmail(email: string): Promise<User | null> {
    const user = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (!user) {
      return null;
    }

    return UserPresenter.toDomain(user);
  }

  async create(user: User): Promise<User> {
    const [created] = await db
      .insert(users)
      .values({
        id: user.id.toString(),
        name: user.name,
        email: user.email,
        password: user.password,
        cpf: user.cpf,
        phone: user.phone,
        role: user.role,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      })
      .returning();

    if (!created) {
      throw new Error('Failed to create user.');
    }

    return UserPresenter.toDomain(created);
  }

  async save(_user: User): Promise<User> {
    throw new Error('Method not implemented.');
  }

  async delete(_user: User): Promise<void> {
    throw new Error('Method not implemented.');
  }
}
