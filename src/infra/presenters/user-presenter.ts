import { User, type UserRole } from '@/core/entities/user';
import { UniqueEntityID } from '@/core/utils/unique-entity-id';
import type { users } from '@/infra/db/drizzle/schema';

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
