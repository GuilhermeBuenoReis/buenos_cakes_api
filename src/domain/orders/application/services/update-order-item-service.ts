import { type Either, error, success } from '../../../../core/either';
import { UniqueEntityID } from '../../../../core/entities/unique-entity-id';
import { UnexpectedError } from '../../../../core/errors/unexpected-error';
import { ProductFillingNotFoundError } from '../../../products/application/errors/product-filling-not-found-error';
import { ProductNotFoundError } from '../../../products/application/errors/product-not-found-error';
import { ProductSizeNotFoundError } from '../../../products/application/errors/product-size-not-found-error';
import type { ProductSizesRepository } from '../../../products/application/repositories/product-sizes-repository';
import type { ProductFillingsRepository } from '../../../products/application/repositories/products-fillings-repository';
import type { ProductsRepository } from '../../../products/application/repositories/products-repository';
import type { OrderItem } from '../../enterprise/entities/order-item';
import { OrderItemNotFoundError } from '../errors/order-item-not-found-error';
import type { OrderItemsRepository } from '../repositories/order-items-repository';

export interface UpdateOrderItemServiceRequest {
  orderItemId: string;
  productId?: string;
  productSizeId?: string | null;
  productFillingId?: string | null;
  quantity?: number;
  unitPrice?: number;
  total?: number;
  note?: string | null;
}

export type UpdateOrderItemServiceResponse = Either<
  | OrderItemNotFoundError
  | ProductNotFoundError
  | ProductSizeNotFoundError
  | ProductFillingNotFoundError
  | UnexpectedError,
  {
    orderItem: OrderItem;
  }
>;

export class UpdateOrderItemService {
  constructor(
    private orderItemsRepository: OrderItemsRepository,
    private productsRepository: ProductsRepository,
    private productSizesRepository: ProductSizesRepository,
    private productFillingsRepository: ProductFillingsRepository
  ) {}

  async execute({
    orderItemId,
    productId,
    productSizeId,
    productFillingId,
    quantity,
    unitPrice,
    total,
    note,
  }: UpdateOrderItemServiceRequest): Promise<UpdateOrderItemServiceResponse> {
    try {
      const orderItem = await this.orderItemsRepository.findById(orderItemId);

      if (!orderItem) {
        return error(new OrderItemNotFoundError(orderItemId));
      }

      const resolvedProductId = productId ?? orderItem.productId.toString();
      const resolvedProductSizeId =
        productSizeId !== undefined
          ? productSizeId
          : orderItem.productSizeId?.toString();
      const resolvedProductFillingId =
        productFillingId !== undefined
          ? productFillingId
          : orderItem.productFillingId?.toString();

      if (productId) {
        const product = await this.productsRepository.findById(productId);

        if (!product) {
          return error(new ProductNotFoundError(productId));
        }
      }

      if (resolvedProductSizeId) {
        const productSize = await this.productSizesRepository.findById(
          resolvedProductSizeId
        );

        if (
          !productSize ||
          productSize.productId.toString() !== resolvedProductId
        ) {
          return error(new ProductSizeNotFoundError(resolvedProductSizeId));
        }
      }

      if (resolvedProductFillingId) {
        const productFilling = await this.productFillingsRepository.findById(
          resolvedProductFillingId
        );

        if (
          !productFilling ||
          productFilling.productId.toString() !== resolvedProductId
        ) {
          return error(
            new ProductFillingNotFoundError(resolvedProductFillingId)
          );
        }
      }

      if (productId !== undefined)
        orderItem.productId = new UniqueEntityID(productId);
      if (productSizeId !== undefined) {
        orderItem.productSizeId = productSizeId
          ? new UniqueEntityID(productSizeId)
          : null;
      }
      if (productFillingId !== undefined) {
        orderItem.productFillingId = productFillingId
          ? new UniqueEntityID(productFillingId)
          : null;
      }
      if (quantity !== undefined) orderItem.quantity = quantity;
      if (unitPrice !== undefined) orderItem.unitPrice = unitPrice;
      if (total !== undefined) orderItem.total = total;
      if (note !== undefined) orderItem.note = note;

      await this.orderItemsRepository.save(orderItem);

      return success({
        orderItem,
      });
    } catch {
      return error(new UnexpectedError());
    }
  }
}
