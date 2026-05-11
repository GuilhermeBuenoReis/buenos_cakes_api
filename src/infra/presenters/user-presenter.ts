import { UniqueEntityID } from '@/core/entities/unique-entity-id';
import { User, type UserRole } from '@/domain/users/enterprise/entities/user';
import type { users } from '../db/schema';

type DrizzleUser = typeof users.$inferSelect;

export class UserPresenter {
  static toDomain(user: DrizzleUser): User {
    return User.create(
      {
        name: user.name,
        email: user.email,
        password: user.password,
        cpf: user.cpf,
        phone: user.phone,
        role: user.role as UserRole,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      new UniqueEntityID(user.id)
    );
  }

  static toHTTP(user: User) {
    return {
      id: user.id.toString(),
      name: user.name,
      email: user.email,
      cpf: user.cpf,
      phone: user.phone,
      role: user.role,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt?.toISOString() ?? null,
    };
  }
}
