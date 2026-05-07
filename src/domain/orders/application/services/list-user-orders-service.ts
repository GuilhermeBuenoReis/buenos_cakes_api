import { type Either, error, success } from '../../../../core/either';
import { UnexpectedError } from '../../../../core/errors/unexpected-error';
import { UserNotFoundError } from '../../../users/application/errors/user-not-found-error';
import type { UsersRepository } from '../../../users/application/repositories/users-repository';
import type { Order } from '../../enterprise/entities/order';
import type { OrdersRepository } from '../repositories/orders-repository';

export interface ListUserOrdersServiceRequest {
  userId: string;
  page: number;
}

export type ListUserOrdersServiceResponse = Either<
  UserNotFoundError | UnexpectedError,
  {
    orders: Order[];
  }
>;

export class ListUserOrdersService {
  constructor(
    private usersRepository: UsersRepository,
    private ordersRepository: OrdersRepository
  ) {}

  async execute({
    userId,
    page,
  }: ListUserOrdersServiceRequest): Promise<ListUserOrdersServiceResponse> {
    try {
      const user = await this.usersRepository.findById(userId);

      if (!user) {
        return error(new UserNotFoundError(userId));
      }

      const orders = await this.ordersRepository.findManyByUserId(userId, {
        page,
      });

      return success({
        orders,
      });
    } catch {
      return error(new UnexpectedError());
    }
  }
}
