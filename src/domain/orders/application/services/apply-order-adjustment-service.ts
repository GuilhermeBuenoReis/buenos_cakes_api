import { type Either, error, success } from '../../../../core/either';
import { UnexpectedError } from '../../../../core/errors/unexpected-error';
import type { ProductSizesRepository } from '../../../products/application/repositories/product-sizes-repository';
import type { ProductFillingsRepository } from '../../../products/application/repositories/products-fillings-repository';
import type { ProductsRepository } from '../../../products/application/repositories/products-repository';
import type { OrderAdjustment } from '../../enterprise/entities/order-adjustment';
import {
  OrderAdjustmentStatus,
  OrderAdjustmentType,
} from '../../enterprise/entities/order-adjustment';
import {
  type OrderChangeOperation,
  computeOrderItemsChange,
  persistOrderItemsChange,
} from '../helpers/compute-order-items-change';
import type { OrderAdjustmentsRepository } from '../repositories/order-adjustments-repository';
import type { OrderItemsRepository } from '../repositories/order-items-repository';
import type { OrdersRepository } from '../repositories/orders-repository';

export interface ApplyOrderAdjustmentServiceRequest {
  paymentId: string;
}

export type ApplyOrderAdjustmentServiceResponse = Either<
  UnexpectedError,
  {
    applied: boolean;
    adjustment?: OrderAdjustment;
  }
>;

export class ApplyOrderAdjustmentService {
  constructor(
    private orderAdjustmentsRepository: OrderAdjustmentsRepository,
    private ordersRepository: OrdersRepository,
    private orderItemsRepository: OrderItemsRepository,
    private productsRepository: ProductsRepository,
    private productSizesRepository: ProductSizesRepository,
    private productFillingsRepository: ProductFillingsRepository
  ) {}

  async execute({
    paymentId,
  }: ApplyOrderAdjustmentServiceRequest): Promise<ApplyOrderAdjustmentServiceResponse> {
    try {
      const adjustment =
        await this.orderAdjustmentsRepository.findByPaymentId(paymentId);

      if (
        !adjustment ||
        adjustment.type !== OrderAdjustmentType.ADDITIONAL_PAYMENT ||
        adjustment.status !== OrderAdjustmentStatus.PENDING
      ) {
        return success({ applied: false });
      }

      const order = await this.ordersRepository.findById(
        adjustment.orderId.toString()
      );

      if (!order) {
        adjustment.markAsCanceled('Order no longer exists.');
        await this.orderAdjustmentsRepository.save(adjustment);

        return success({ applied: false, adjustment });
      }

      const currentItems =
        await this.orderItemsRepository.findManyByOrderId(
          adjustment.orderId.toString()
        );

      const computed = await computeOrderItemsChange({
        order,
        currentItems,
        operation: adjustment.operation as OrderChangeOperation,
        productsRepository: this.productsRepository,
        productSizesRepository: this.productSizesRepository,
        productFillingsRepository: this.productFillingsRepository,
      });

      if (computed.isError()) {
        adjustment.markAsCanceled(computed.value.message);
        await this.orderAdjustmentsRepository.save(adjustment);

        return success({ applied: false, adjustment });
      }

      await persistOrderItemsChange(
        computed.value,
        order,
        this.ordersRepository,
        this.orderItemsRepository
      );

      adjustment.markAsConfirmed();
      await this.orderAdjustmentsRepository.save(adjustment);

      return success({ applied: true, adjustment });
    } catch {
      return error(new UnexpectedError());
    }
  }
}
