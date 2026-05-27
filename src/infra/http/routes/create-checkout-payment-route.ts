import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';

import { UnexpectedError } from '@/core/errors/unexpected-error';
import { OrderNotFoundError } from '@/domain/orders/application/errors/order-not-found-error';
import { PaymentGatewayError } from '@/domain/orders/application/errors/payment-gateway-error';
import { CreateCheckoutPaymentService } from '@/domain/orders/application/services/create-checkout-payment-service';
import { DrizzleOrdersRepository } from '@/infra/db/repositories/drizzle-orders-repository';
import { DrizzlePaymentsRepository } from '@/infra/db/repositories/drizzle-payments-repository';
import { AbacatePayPaymentGateway } from '@/infra/payment/abacate-pay/abacate-pay-payment-gateway';
import { PaymentPresenter } from '@/infra/presenters/payment-presenter';
import { env } from '../env';
import { userAuthMiddleware } from '../middlewares/user-auth-middleware';

export const createCheckoutPaymentRoute: FastifyPluginAsyncZod = async (
  app
) => {
  app.post(
    '/api/payments/checkout',
    {
      onRequest: userAuthMiddleware,
      schema: {
        summary: 'Create a checkout payment',
        operationId: 'createCheckoutPayment',
        tags: ['Payments'],
        body: z.object({
          orderId: z.string().min(1),
          successUrl: z.url().optional(),
          cancelUrl: z.url().optional(),
          customerEmail: z.email().nullable().optional(),
        }),
        response: {
          201: z.object({
            checkoutUrl: z.url(),
            payment: z.object({
              id: z.string(),
              orderId: z.string(),
              method: z
                .enum(['pix', 'credit_card', 'debit_card', 'cash'])
                .nullable(),
              provider: z.enum(['external', 'manual']),
              status: z.enum([
                'pending',
                'processing',
                'paid',
                'failed',
                'canceled',
                'refunded',
              ]),
              amount: z.number(),
              currency: z.string(),
              providerName: z.string().nullable().optional(),
              providerReferenceId: z.string().nullable().optional(),
              providerSessionId: z.string().nullable().optional(),
              providerCustomerId: z.string().nullable().optional(),
              providerPaymentMethodId: z.string().nullable().optional(),
              providerClientSecret: z.string().nullable().optional(),
              providerStatus: z.string().nullable().optional(),
              pixQrCode: z.string().nullable().optional(),
              pixQrCodeUrl: z.string().nullable().optional(),
              expiresAt: z.iso.datetime().nullable().optional(),
              failureReason: z.string().nullable().optional(),
              paidAt: z.iso.datetime().nullable().optional(),
              canceledAt: z.iso.datetime().nullable().optional(),
              refundedAt: z.iso.datetime().nullable().optional(),
              createdAt: z.iso.datetime(),
              updatedAt: z.iso.datetime().nullable().optional(),
            }),
          }),
          400: z.object({ message: z.string() }),
          404: z.object({ message: z.string() }),
          502: z.object({ message: z.string() }),
          500: z.object({ message: z.string() }),
        },
      },
    },
    async (request, reply) => {
      try {
        if (!env.ABACATE_PAY_API_KEY) {
          return reply
            .status(500)
            .send({ message: 'Payment provider is not configured.' });
        }

        const paymentsRepository = new DrizzlePaymentsRepository();
        const ordersRepository = new DrizzleOrdersRepository();
        const paymentGateway = new AbacatePayPaymentGateway({
          apiKey: env.ABACATE_PAY_API_KEY,
          baseUrl: env.ABACATE_PAY_BASE_URL,
          returnUrl: env.ABACATE_PAY_RETURN_URL,
          completionUrl: env.ABACATE_PAY_COMPLETION_URL,
        });
        const createCheckoutPaymentService =
          new CreateCheckoutPaymentService(
            paymentsRepository,
            ordersRepository,
            paymentGateway
          );

        const { orderId, successUrl, cancelUrl, customerEmail } = request.body;

        const result = await createCheckoutPaymentService.execute({
          orderId,
          successUrl,
          cancelUrl,
          customerEmail,
        });

        if (result.isError()) {
          const error = result.value;

          if (error instanceof OrderNotFoundError) {
            return reply.status(404).send({ message: error.message });
          }

          if (error instanceof UnexpectedError) {
            return reply.status(500).send({ message: error.message });
          }

          if (error instanceof PaymentGatewayError) {
            return reply.status(502).send({ message: error.message });
          }

          return reply.status(400).send({ message: 'Bad request' });
        }

        const { checkoutUrl, payment } = result.value;

        return reply.status(201).send({
          checkoutUrl,
          payment: PaymentPresenter.toHTTP(payment),
        });
      } catch (error) {
        request.log.error(error);

        if (error instanceof PaymentGatewayError) {
          return reply.status(502).send({ message: error.message });
        }

        return reply.status(500).send({ message: 'Internal server error' });
      }
    }
  );
};
