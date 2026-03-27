import type { Optional } from '../types/optional';
import { Entity } from '../utils/entity';
import type { UniqueEntityID } from '../utils/unique-entity-id';

export enum UserRole {
  CUSTOMER = 'customer',
  ADMIN = 'admin',
}

interface UserProps {
  name: string;
  email: string;
  passwordHash: string;
  cpf?: string | null;
  phone?: string | null;
  role: UserRole;

  createdAt: Date;
  updatedAt?: Date | null;
}

export class User extends Entity<UserProps> {
  get name() {
    return this.props.name;
  }
  get email() {
    return this.props.email;
  }

  get passwordHash() {
    return this.props.passwordHash;
  }

  get cpf() {
    return this.props.cpf;
  }

  get phone() {
    return this.props.phone;
  }

  get role() {
    return this.props.role;
  }

  get createdAt() {
    return this.props.createdAt;
  }

  get updatedAt() {
    return this.props.updatedAt;
  }

  private touch() {
    this.props.updatedAt = new Date();
  }

  set name(name: string) {
    this.props.name = name;
    this.touch();
  }

  set email(email: string) {
    this.props.email = email;
    this.touch();
  }

  set passwordHash(passwordHash: string) {
    this.props.passwordHash = passwordHash;
    this.touch();
  }

  set cpf(cpf: string | null | undefined) {
    this.props.cpf = cpf ?? null;
    this.touch();
  }

  set phone(phone: string | null | undefined) {
    this.props.phone = phone ?? null;
    this.touch();
  }

  set role(role: UserRole) {
    this.props.role = role;
    this.touch();
  }

  static create(
    props: Optional<UserProps, 'createdAt' | 'role'>,
    id?: UniqueEntityID
  ) {
    const user = new User(
      {
        ...props,
        cpf: props.cpf ?? null,
        phone: props.phone ?? null,
        role: props.role ?? UserRole.CUSTOMER,
        createdAt: props.createdAt ?? new Date(),
      },
      id
    );

    return user;
  }
}
