import type { Address } from '../entities/address';
import type { AddressesRepository } from '../repositories/addresses-repository';
import type { UsersRepository } from '../repositories/users-repository';
import { type Either, error, success } from '../utils/either';
import { UnexpectedError } from './errors/unexpected-error';
import { UserNotFoundError } from './errors/user-not-found-error';

export interface ListUserAddressesServiceRequest {
  userId: string;
}

export type ListUserAddressesServiceResponse = Either<
  UserNotFoundError | UnexpectedError,
  {
    addresses: Address[];
  }
>;

export class ListUserAddressesService {
  constructor(
    private usersRepository: UsersRepository,
    private addressesRepository: AddressesRepository
  ) {}

  async execute({
    userId,
  }: ListUserAddressesServiceRequest): Promise<ListUserAddressesServiceResponse> {
    try {
      const user = await this.usersRepository.findById(userId);

      if (!user) {
        return error(new UserNotFoundError(userId));
      }

      const addresses = await this.addressesRepository.findManyByUserId(
        user.id
      );

      return success({
        addresses,
      });
    } catch {
      return error(new UnexpectedError());
    }
  }
}
