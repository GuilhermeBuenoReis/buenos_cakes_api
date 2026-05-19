import { type Either, error, success } from '../../../../core/either';
import { UnexpectedError } from '../../../../core/errors/unexpected-error';
import { Address } from '../../enterprise/entities/address';
import { UserNotFoundError } from '../errors/user-not-found-error';
import { AddressDefaultHelper } from '../helpers/address-default-helper';
import type { AddressesRepository } from '../repositories/addresses-repository';
import type { UsersRepository } from '../repositories/users-repository';

export interface CreateAddressServiceRequest {
  userId: string;
  label: string;
  recipientName: string;
  street: string;
  houseNumber: string;
  complement?: string | null;
  city: string;
  state: string;
  zipCode: string;
  reference?: string | null;
  isDefault?: boolean;
}

export type CreateAddressServiceResponse = Either<
  UserNotFoundError | UnexpectedError,
  {
    address: Address;
  }
>;

export class CreateAddressService {
  private addressDefaultHelper: AddressDefaultHelper;

  constructor(
    private usersRepository: UsersRepository,
    private addressesRepository: AddressesRepository
  ) {
    this.addressDefaultHelper = new AddressDefaultHelper(addressesRepository);
  }

  async execute({
    userId,
    label,
    recipientName,
    street,
    houseNumber,
    complement,
    city,
    state,
    zipCode,
    reference,
    isDefault,
  }: CreateAddressServiceRequest): Promise<CreateAddressServiceResponse> {
    try {
      const user = await this.usersRepository.findById(userId);

      if (!user) {
        return error(new UserNotFoundError(userId));
      }

      const newAddressShouldBeDefault =
        await this.addressDefaultHelper.resolveCreateDefaultStatus(
          user.id,
          isDefault
        );

      const address = Address.create({
        userId: user.id,
        label,
        recipientName,
        street,
        houseNumber,
        complement,
        city,
        state,
        zipCode,
        reference,
        isDefault: newAddressShouldBeDefault,
      });

      await this.addressesRepository.create(address);

      return success({
        address,
      });
    } catch {
      return error(new UnexpectedError());
    }
  }
}
