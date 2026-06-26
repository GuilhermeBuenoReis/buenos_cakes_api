import type { FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';

import { UnexpectedError } from '@/core/errors/unexpected-error';
import { OrderDoesNotBelongToUserError } from '@/domain/orders/application/errors/order-does-not-belong-to-user-error';
import { OrderEditDeadlineExpiredError } from '@/domain/orders/application/errors/order-edit-deadline-expired-error';
import { OrderItemNotFoundError } from '@/domain/orders/application/errors/order-item-not-found-error';
import { OrderMustHaveItemsError } from '@/domain/orders/application/errors/order-must-have-items-error';
import { OrderNotFoundError } from '@/domain/orders/application/errors/order-not-found-error';
import { OrderStatusNotEditableError } from '@/domain/orders/application/errors/order-status-not-editable-error';
import { PaymentGatewayError } from '@/domain/orders/application/errors/payment-gateway-error';
import type { OrderChangeOperation } from '@/domain/orders/application/helpers/compute-order-items-change';
import { ChangeOrderItemsService } from '@/domain/orders/application/services/change-order-items-service';
import { ProductFillingNotFoundError } from '@/domain/products/application/errors/product-filling-not-found-error';
import { ProductNotAvailableError } from '@/domain/products/application/errors/product-not-available-error';
import { ProductNotFoundError } from '@/domain/products/application/errors/product-not-found-error';
import { ProductSizeNotFoundError } from '@/domain/products/application/errors/product-size-not-found-error';
import { DrizzleOrderAdjustmentsRepository } from '@/infra/db/repositories/drizzle-order-adjustments-repository';
import { DrizzleOrderItemsRepository } from '@/infra/db/repositories/drizzle-order-items-repository';
import { DrizzleOrdersRepository } from '@/infra/db/repositories/drizzle-orders-repository';
import { DrizzlePaymentsRepository } from '@/infra/db/repositories/drizzle-payments-repository';
import { DrizzleProductFillingsRepository } from '@/infra/db/repositories/drizzle-product-fillings-repository';
import { DrizzleProductSizesRepository } from '@/infra/db/repositories/drizzle-product-sizes-repository';
import { DrizzleProductsRepository } from '@/infra/db/repositories/drizzle-products-repository';
import { AbacatePayPaymentGateway } from '@/infra/payment/abacate-pay/abacate-pay-payment-gateway';
import { OrderAdjustmentPresenter } from '@/infra/presenters/order-adjustment-presenter';
import { OrderPresenter } from '@/infra/presenters/order-presenter';
import { PaymentPresenter } from '@/infra/presenters/payment-presenter';
import { env } from '../env';

export const orderHttpSchema = z.object({
  id: z.string(),
  userId: z.string(),
  status: z.enum([
    'pending',
    'confirmed',
    'preparing',
    'ready',
    'completed',
    'canceled',
  ]),
  fulfillmentMethod: z.enum(['pickup', 'delivery']),
  deliveryAddressId: z.string().nullable().optional(),
  pickupScheduledAt: z.iso.datetime().nullable().optional(),
  customerNote: z.string().nullable().optional(),
  subtotal: z.number(),
  deliveryFee: z.number(),
  total: z.number(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime().nullable().optional(),
});

export const orderChangeHttpSchema = z.object({
  status: z.enum(['applied', 'requires_additional_payment', 'refund_required']),
  previousTotal: z.number(),
  newTotal: z.number(),
  difference: z.number(),
  adjustment: z
    .object({
      id: z.string(),
      orderId: z.string(),
      requestedByUserId: z.string(),
      type: z.enum(['additional_payment', 'refund']),
      status: z.enum(['pending', 'confirmed', 'canceled']),
      previousTotal: z.number(),
      newTotal: z.number(),
      difference: z.number(),
      paymentId: z.string().nullable().optional(),
      reason: z.string().nullable().optional(),
      createdAt: z.iso.datetime(),
      confirmedAt: z.iso.datetime().nullable().optional(),
      updatedAt: z.iso.datetime().nullable().optional(),
    })
    .optional(),
  payment: z
    .object({
      id: z.string(),
      orderId: z.string(),
      status: z.string(),
      amount: z.number(),
      currency: z.string(),
      providerName: z.string().nullable().optional(),
      providerSessionId: z.string().nullable().optional(),
      expiresAt: z.iso.datetime().nullable().optional(),
    })
    .optional(),
  checkoutUrl: z.string().optional(),
});

export const orderItemsChangeResponseSchema = z.object({
  order: orderHttpSchema,
  change: orderChangeHttpSchema,
});

export async function handleOrderItemsChange(
  request: FastifyRequest,
  reply: FastifyReply,
  params: {
    orderId: string;
    operation: OrderChangeOperation;
    successUrl?: string;
    cancelUrl?: string;
    customerEmail?: string | null;
    successStatusCode?: 200 | 201;
  }
) {
  const userId = request.user?.id;

  if (!userId) {
    return reply.status(401).send({ message: 'Unauthorized.' });
  }

  const changeOrderItemsService = new ChangeOrderItemsService(
    new DrizzleOrdersRepository(),
    new DrizzleOrderItemsRepository(),
    new DrizzleProductsRepository(),
    new DrizzleProductSizesRepository(),
    new DrizzleProductFillingsRepository(),
    new DrizzlePaymentsRepository(),
    new DrizzleOrderAdjustmentsRepository(),
    new AbacatePayPaymentGateway({
      apiKey: env.ABACATE_PAY_API_KEY,
      baseUrl: env.ABACATE_PAY_BASE_URL,
      returnUrl: env.ABACATE_PAY_RETURN_URL,
      completionUrl: env.ABACATE_PAY_COMPLETION_URL,
    })
  );

  try {
    const result = await changeOrderItemsService.execute({
      orderId: params.orderId,
      userId,
      operation: params.operation,
      successUrl: params.successUrl,
      cancelUrl: params.cancelUrl,
      customerEmail: params.customerEmail,
    });

    if (result.isError()) {
      const error = result.value;

      if (
        error instanceof OrderNotFoundError ||
        error instanceof OrderItemNotFoundError ||
        error instanceof ProductNotFoundError ||
        error instanceof ProductSizeNotFoundError ||
        error instanceof ProductFillingNotFoundError
      ) {
        return reply.status(404).send({ message: error.message });
      }

      if (error instanceof OrderDoesNotBelongToUserError) {
        return reply.status(403).send({ message: error.message });
      }

      if (
        error instanceof OrderStatusNotEditableError ||
        error instanceof OrderEditDeadlineExpiredError ||
        error instanceof OrderMustHaveItemsError ||
        error instanceof ProductNotAvailableError
      ) {
        return reply.status(409).send({ message: error.message });
      }

      if (error instanceof PaymentGatewayError) {
        return reply.status(502).send({ message: error.message });
      }

      if (error instanceof UnexpectedError) {
        return reply.status(500).send({ message: error.message });
      }

      return reply.status(400).send({ message: 'Bad request' });
    }

    const { order, change } = result.value;

    return reply.status(params.successStatusCode ?? 200).send({
      order: OrderPresenter.toHTTP(order),
      change: {
        status: change.status,
        previousTotal: change.previousTotal,
        newTotal: change.newTotal,
        difference: change.difference,
        adjustment: change.adjustment
          ? OrderAdjustmentPresenter.toHTTP(change.adjustment)
          : undefined,
        payment: change.payment
          ? {
              id: change.payment.id.toString(),
              orderId: change.payment.orderId.toString(),
              status: change.payment.status,
              amount: change.payment.amount,
              currency: change.payment.currency,
              providerName: change.payment.providerName,
              providerSessionId: change.payment.providerSessionId,
              expiresAt: change.payment.expiresAt?.toISOString() ?? null,
            }
          : undefined,
        checkoutUrl: change.checkoutUrl,
      },
    });
  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({ message: 'Internal server error' });
  }
}

export const orderItemsChangeErrorResponses = {
  400: z.object({ message: z.string() }),
  401: z.object({ message: z.string() }),
  403: z.object({ message: z.string() }),
  404: z.object({ message: z.string() }),
  409: z.object({ message: z.string() }),
  502: z.object({ message: z.string() }),
  500: z.object({ message: z.string() }),
};
