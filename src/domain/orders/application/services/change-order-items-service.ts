import { type Either, error, success } from '../../../../core/either';
import { UnexpectedError } from '../../../../core/errors/unexpected-error';
import type { ProductFillingNotFoundError } from '../../../products/application/errors/product-filling-not-found-error';
import type { ProductNotAvailableError } from '../../../products/application/errors/product-not-available-error';
import type { ProductNotFoundError } from '../../../products/application/errors/product-not-found-error';
import type { ProductSizeNotFoundError } from '../../../products/application/errors/product-size-not-found-error';
import type { ProductSizesRepository } from '../../../products/application/repositories/product-sizes-repository';
import type { ProductFillingsRepository } from '../../../products/application/repositories/products-fillings-repository';
import type { ProductsRepository } from '../../../products/application/repositories/products-repository';
import type { Order } from '../../enterprise/entities/order';
import {
  OrderAdjustment,
  OrderAdjustmentType,
  type OrderChangeOperationSnapshot,
} from '../../enterprise/entities/order-adjustment';
import { Payment, PaymentProvider, PaymentStatus } from '../../enterprise/entities/payment';
import type { OrderEditDeadlineExpiredError } from '../errors/order-edit-deadline-expired-error';
import { OrderDoesNotBelongToUserError } from '../errors/order-does-not-belong-to-user-error';
import type { OrderItemNotFoundError } from '../errors/order-item-not-found-error';
import type { OrderMustHaveItemsError } from '../errors/order-must-have-items-error';
import { OrderNotFoundError } from '../errors/order-not-found-error';
import type { OrderStatusNotEditableError } from '../errors/order-status-not-editable-error';
import { PaymentGatewayError } from '../errors/payment-gateway-error';
import type { PaymentGateway } from '../gateways/payment-gateway';
import {
  type ComputeOrderItemsChangeResult,
  type OrderChangeOperation,
  computeOrderItemsChange,
  persistOrderItemsChange,
} from '../helpers/compute-order-items-change';
import { getOrderEditViolation } from '../helpers/order-edit-policy';
import { roundMoney } from '../helpers/order-item-pricing';
import type { OrderAdjustmentsRepository } from '../repositories/order-adjustments-repository';
import type { OrderItemsRepository } from '../repositories/order-items-repository';
import type { OrdersRepository } from '../repositories/orders-repository';
import type { PaymentsRepository } from '../repositories/payments-repository';

export type OrderChangeStatus =
  | 'applied'
  | 'requires_additional_payment'
  | 'refund_required';

export interface ChangeOrderItemsServiceRequest {
  orderId: string;
  userId: string;
  operation: OrderChangeOperation;
  successUrl?: string;
  cancelUrl?: string;
  customerEmail?: string | null;
}

export interface OrderChangeResult {
  status: OrderChangeStatus;
  previousTotal: number;
  newTotal: number;
  difference: number;
  adjustment?: OrderAdjustment;
  payment?: Payment;
  checkoutUrl?: string;
}

export type ChangeOrderItemsServiceResponse = Either<
  | OrderNotFoundError
  | OrderDoesNotBelongToUserError
  | OrderStatusNotEditableError
  | OrderEditDeadlineExpiredError
  | OrderItemNotFoundError
  | OrderMustHaveItemsError
  | ProductNotFoundError
  | ProductNotAvailableError
  | ProductSizeNotFoundError
  | ProductFillingNotFoundError
  | PaymentGatewayError
  | UnexpectedError,
  {
    order: Order;
    change: OrderChangeResult;
  }
>;

export class ChangeOrderItemsService {
  constructor(
    private ordersRepository: OrdersRepository,
    private orderItemsRepository: OrderItemsRepository,
    private productsRepository: ProductsRepository,
    private productSizesRepository: ProductSizesRepository,
    private productFillingsRepository: ProductFillingsRepository,
    private paymentsRepository: PaymentsRepository,
    private orderAdjustmentsRepository: OrderAdjustmentsRepository,
    private paymentGateway: PaymentGateway
  ) {}

  async execute(
    request: ChangeOrderItemsServiceRequest
  ): Promise<ChangeOrderItemsServiceResponse> {
    try {
      const order = await this.ordersRepository.findById(request.orderId);

      if (!order) {
        return error(new OrderNotFoundError(request.orderId));
      }

      if (order.userId.toString() !== request.userId) {
        return error(new OrderDoesNotBelongToUserError());
      }

      const violation = getOrderEditViolation(order);

      if (violation) {
        return error(violation);
      }

      const currentItems =
        await this.orderItemsRepository.findManyByOrderId(request.orderId);

      const computed = await computeOrderItemsChange({
        order,
        currentItems,
        operation: request.operation,
        productsRepository: this.productsRepository,
        productSizesRepository: this.productSizesRepository,
        productFillingsRepository: this.productFillingsRepository,
      });

      if (computed.isError()) {
        return error(computed.value);
      }

      const previousTotal = order.total;
      const newTotal = computed.value.total;
      const difference = roundMoney(newTotal - previousTotal);

      const isPaid = await this.isOrderPaid(request.orderId);

      if (!isPaid || difference === 0) {
        await persistOrderItemsChange(
          computed.value,
          order,
          this.ordersRepository,
          this.orderItemsRepository
        );

        return success({
          order,
          change: {
            status: 'applied',
            previousTotal,
            newTotal,
            difference,
          },
        });
      }

      if (difference > 0) {
        return await this.handleAdditionalPayment({
          request,
          order,
          previousTotal,
          newTotal,
          difference,
        });
      }

      return await this.handleRefund({
        request,
        order,
        computed: computed.value,
        previousTotal,
        newTotal,
        difference,
      });
    } catch (err) {
      if (err instanceof PaymentGatewayError) {
        return error(err);
      }

      return error(new UnexpectedError());
    }
  }

  private async isOrderPaid(orderId: string): Promise<boolean> {
    const payments =
      await this.paymentsRepository.findManyByOrderId(orderId);

    return payments.some((payment) => payment.status === PaymentStatus.PAID);
  }

  private async handleAdditionalPayment({
    request,
    order,
    previousTotal,
    newTotal,
    difference,
  }: {
    request: ChangeOrderItemsServiceRequest;
    order: Order;
    previousTotal: number;
    newTotal: number;
    difference: number;
  }): Promise<ChangeOrderItemsServiceResponse> {
    const payment = Payment.create({
      orderId: order.id,
      provider: PaymentProvider.EXTERNAL,
      amount: difference,
      currency: 'brl',
      providerName: this.paymentGateway.providerName,
    });

    const checkoutSession = await this.paymentGateway.createCheckoutSession({
      orderId: order.id.toString(),
      paymentId: payment.id.toString(),
      amount: payment.amount,
      currency: payment.currency,
      successUrl: request.successUrl,
      cancelUrl: request.cancelUrl,
      customerEmail: request.customerEmail,
    });

    payment.providerName = checkoutSession.providerName;
    payment.providerSessionId = checkoutSession.providerSessionId;
    payment.providerReferenceId = checkoutSession.providerReferenceId;
    payment.providerCustomerId = checkoutSession.providerCustomerId;
    payment.providerPaymentMethodId = checkoutSession.providerPaymentMethodId;
    payment.providerClientSecret = checkoutSession.providerClientSecret;
    payment.expiresAt = checkoutSession.expiresAt;
    payment.markAsProcessing(checkoutSession.providerStatus);

    await this.paymentsRepository.create(payment);

    const adjustment = OrderAdjustment.create({
      orderId: order.id,
      requestedByUserId: order.userId,
      type: OrderAdjustmentType.ADDITIONAL_PAYMENT,
      previousTotal,
      newTotal,
      difference,
      paymentId: payment.id,
      operation: toOperationSnapshot(request.operation),
    });

    await this.orderAdjustmentsRepository.create(adjustment);

    return success({
      order,
      change: {
        status: 'requires_additional_payment',
        previousTotal,
        newTotal,
        difference,
        adjustment,
        payment,
        checkoutUrl: checkoutSession.checkoutUrl,
      },
    });
  }

  private async handleRefund({
    request,
    order,
    computed,
    previousTotal,
    newTotal,
    difference,
  }: {
    request: ChangeOrderItemsServiceRequest;
    order: Order;
    computed: ComputeOrderItemsChangeResult;
    previousTotal: number;
    newTotal: number;
    difference: number;
  }): Promise<ChangeOrderItemsServiceResponse> {
    await persistOrderItemsChange(
      computed,
      order,
      this.ordersRepository,
      this.orderItemsRepository
    );

    const adjustment = OrderAdjustment.create({
      orderId: order.id,
      requestedByUserId: order.userId,
      type: OrderAdjustmentType.REFUND,
      previousTotal,
      newTotal,
      difference,
      operation: toOperationSnapshot(request.operation),
    });

    await this.orderAdjustmentsRepository.create(adjustment);

    return success({
      order,
      change: {
        status: 'refund_required',
        previousTotal,
        newTotal,
        difference,
        adjustment,
      },
    });
  }
}

function toOperationSnapshot(
  operation: OrderChangeOperation
): OrderChangeOperationSnapshot {
  return {
    action: operation.action,
    orderItemId: operation.orderItemId ?? null,
    productId: operation.productId ?? null,
    productSizeId: operation.productSizeId,
    productFillingId: operation.productFillingId,
    quantity: operation.quantity ?? null,
    note: operation.note,
  };
}
