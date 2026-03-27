import { faker } from '@faker-js/faker';
import type { RegisterUserServiceRequest } from '../../core/service/register-user-service';

export function makeRegisterUserServiceRequest(
  overrides: Partial<RegisterUserServiceRequest> = {}
): RegisterUserServiceRequest {
  return {
    name: faker.person.fullName(),
    email: faker.internet.email().toLowerCase(),
    password: faker.internet.password(),
    ...overrides,
  };
}
