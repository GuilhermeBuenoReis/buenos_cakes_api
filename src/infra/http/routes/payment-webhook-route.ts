import { createHmac, timingSafeEqual } from 'node:crypto';
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';

import { UnexpectedError } from '@/core/errors/unexpected-error';
import { PaymentNotFoundError } from '@/domain/orders/application/errors/payment-not-found-error';
import { ApplyOrderAdjustmentService } from '@/domain/orders/application/services/apply-order-adjustment-service';
import { HandlePaymentGatewayWebhookService } from '@/domain/orders/application/services/handle-payment-gateway-webhook-service';
import { DrizzleOrderAdjustmentsRepository } from '@/infra/db/repositories/drizzle-order-adjustments-repository';
import { DrizzleOrderItemsRepository } from '@/infra/db/repositories/drizzle-order-items-repository';
import { DrizzleOrdersRepository } from '@/infra/db/repositories/drizzle-orders-repository';
import { DrizzlePaymentsRepository } from '@/infra/db/repositories/drizzle-payments-repository';
import { DrizzleProductFillingsRepository } from '@/infra/db/repositories/drizzle-product-fillings-repository';
import { DrizzleProductSizesRepository } from '@/infra/db/repositories/drizzle-product-sizes-repository';
import { DrizzleProductsRepository } from '@/infra/db/repositories/drizzle-products-repository';
import { AbacatePayPaymentGateway } from '@/infra/payment/abacate-pay/abacate-pay-payment-gateway';
import { env } from '../env';

export const paymentWebhookRoute: FastifyPluginAsyncZod = async (app) => {
  app.post(
    '/api/payments/webhook',
    {
      schema: {
        summary: 'Handle payment webhook',
        operationId: 'handlePaymentWebhook',
        tags: ['Payments'],
        headers: z.object({
          'x-webhook-signature': z.string().optional(),
        }).catchall(z.unknown()),
        body: z.unknown(),
        response: {
          200: z.object({
            received: z.boolean(),
            ignored: z.boolean().optional(),
          }),
          400: z.object({ message: z.string() }),
          401: z.object({ message: z.string() }),
          404: z.object({ message: z.string() }),
          500: z.object({ message: z.string() }),
        },
      },
    },
    async (request, reply) => {
      try {
        const signature = getHeaderValue(request.headers['x-webhook-signature']);
        const isValidSignature = verifyAbacatePaySignature({
          publicKey: env.ABACATE_PAY_WEBHOOK_PUBLIC_KEY,
          rawBody: getRawBody(request),
          signature,
        });

        if (!isValidSignature && shouldVerifyWebhookSignature(signature)) {
          return reply.status(401).send({ message: 'Unauthorized.' });
        }

        const paymentGateway = new AbacatePayPaymentGateway({
          apiKey: env.ABACATE_PAY_API_KEY,
          baseUrl: env.ABACATE_PAY_BASE_URL,
          returnUrl: env.ABACATE_PAY_RETURN_URL,
          completionUrl: env.ABACATE_PAY_COMPLETION_URL,
        });
        const paymentEvent = await paymentGateway.parseWebhookEvent(
          request.body
        );

        if (!paymentEvent) {
          return reply.status(200).send({
            received: true,
            ignored: true,
          });
        }

        const paymentsRepository = new DrizzlePaymentsRepository();
        const applyOrderAdjustmentService = new ApplyOrderAdjustmentService(
          new DrizzleOrderAdjustmentsRepository(),
          new DrizzleOrdersRepository(),
          new DrizzleOrderItemsRepository(),
          new DrizzleProductsRepository(),
          new DrizzleProductSizesRepository(),
          new DrizzleProductFillingsRepository()
        );
        const handlePaymentGatewayWebhookService =
          new HandlePaymentGatewayWebhookService(
            paymentsRepository,
            applyOrderAdjustmentService
          );
        const result = await handlePaymentGatewayWebhookService.execute({
          event: paymentEvent,
        });

        if (result.isError()) {
          const error = result.value;

          if (error instanceof PaymentNotFoundError) {
            return reply.status(404).send({ message: error.message });
          }

          if (error instanceof UnexpectedError) {
            return reply.status(500).send({ message: error.message });
          }

          return reply.status(400).send({ message: 'Bad request' });
        }

        return reply.status(200).send({
          received: true,
        });
      } catch (error) {
        request.log.error(error);
        return reply.status(400).send({ message: 'Invalid payment webhook.' });
      }
    }
  );
};

function verifyAbacatePaySignature({
  publicKey,
  rawBody,
  signature,
}: {
  publicKey: string;
  rawBody?: string;
  signature?: string;
}) {
  if (!rawBody || !signature) {
    return false;
  }

  const expectedSignature = createHmac('sha256', publicKey)
    .update(Buffer.from(rawBody, 'utf8'))
    .digest('base64');
  const expectedBuffer = Buffer.from(expectedSignature);
  const receivedBuffer = Buffer.from(signature);

  if (expectedBuffer.length !== receivedBuffer.length) {
    return false;
  }

  return timingSafeEqual(expectedBuffer, receivedBuffer);
}

function getRawBody(request: unknown) {
  return (request as { rawBody?: string }).rawBody;
}

function getHeaderValue(header: string | string[] | undefined) {
  return Array.isArray(header) ? header[0] : header;
}

function shouldVerifyWebhookSignature(signature?: string) {
  return env.NODE_ENV !== 'development' || Boolean(signature);
}
