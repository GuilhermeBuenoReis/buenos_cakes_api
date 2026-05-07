import { type Either, error, success } from '../../../../core/either';
import { UniqueEntityID } from '../../../../core/entities/unique-entity-id';
import { UnexpectedError } from '../../../../core/errors/unexpected-error';
import { ProductFillingNotFoundError } from '../../../products/application/errors/product-filling-not-found-error';
import { ProductNotFoundError } from '../../../products/application/errors/product-not-found-error';
import { ProductSizeNotFoundError } from '../../../products/application/errors/product-size-not-found-error';
import type { ProductSizesRepository } from '../../../products/application/repositories/product-sizes-repository';
import type { ProductFillingsRepository } from '../../../products/application/repositories/products-fillings-repository';
import type { ProductsRepository } from '../../../products/application/repositories/products-repository';
import { OrderItem } from '../../enterprise/entities/order-item';
import { OrderNotFoundError } from '../errors/order-not-found-error';
import type { OrderItemsRepository } from '../repositories/order-items-repository';
import type { OrdersRepository } from '../repositories/orders-repository';

export interface CreateOrderItemServiceRequest {
  orderId: string;
  productId: string;
  productSizeId?: string | null;
  productFillingId?: string | null;
  quantity: number;
  unitPrice: number;
  total: number;
  note?: string | null;
}

export type CreateOrderItemServiceResponse = Either<
  | OrderNotFoundError
  | ProductNotFoundError
  | ProductSizeNotFoundError
  | ProductFillingNotFoundError
  | UnexpectedError,
  {
    orderItem: OrderItem;
  }
>;

export class CreateOrderItemService {
  constructor(
    private orderItemsRepository: OrderItemsRepository,
    private ordersRepository: OrdersRepository,
    private productsRepository: ProductsRepository,
    private productSizesRepository: ProductSizesRepository,
    private productFillingsRepository: ProductFillingsRepository
  ) {}

  async execute({
    orderId,
    productId,
    productSizeId,
    productFillingId,
    quantity,
    unitPrice,
    total,
    note,
  }: CreateOrderItemServiceRequest): Promise<CreateOrderItemServiceResponse> {
    try {
      const order = await this.ordersRepository.findById(orderId);

      if (!order) {
        return error(new OrderNotFoundError(orderId));
      }

      const product = await this.productsRepository.findById(productId);

      if (!product) {
        return error(new ProductNotFoundError(productId));
      }

      if (productSizeId) {
        const productSize =
          await this.productSizesRepository.findById(productSizeId);

        if (!productSize?.productId.equals(product.id)) {
          return error(new ProductSizeNotFoundError(productSizeId));
        }
      }

      if (productFillingId) {
        const productFilling =
          await this.productFillingsRepository.findById(productFillingId);

        if (!productFilling?.productId.equals(product.id)) {
          return error(new ProductFillingNotFoundError(productFillingId));
        }
      }

      const orderItem = OrderItem.create({
        orderId: new UniqueEntityID(orderId),
        productId: new UniqueEntityID(productId),
        productSizeId: productSizeId ? new UniqueEntityID(productSizeId) : null,
        productFillingId: productFillingId
          ? new UniqueEntityID(productFillingId)
          : null,
        quantity,
        unitPrice,
        total,
        note,
      });

      await this.orderItemsRepository.create(orderItem);

      return success({
        orderItem,
      });
    } catch {
      return error(new UnexpectedError());
    }
  }
}
