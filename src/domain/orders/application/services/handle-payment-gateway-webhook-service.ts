import { type Either, error, success } from '../../../../core/either';
import { UnexpectedError } from '../../../../core/errors/unexpected-error';
import type { Payment } from '../../enterprise/entities/payment';
import { PaymentStatus } from '../../enterprise/entities/payment';
import { PaymentNotFoundError } from '../errors/payment-not-found-error';
import type { PaymentGatewayWebhookEvent } from '../gateways/payment-gateway';
import type { PaymentsRepository } from '../repositories/payments-repository';

export interface HandlePaymentGatewayWebhookServiceRequest {
  event: PaymentGatewayWebhookEvent;
}

export type HandlePaymentGatewayWebhookServiceResponse = Either<
  PaymentNotFoundError | UnexpectedError,
  {
    payment: Payment;
  }
>;

export class HandlePaymentGatewayWebhookService {
  constructor(private paymentsRepository: PaymentsRepository) {}

  async execute({
    event,
  }: HandlePaymentGatewayWebhookServiceRequest): Promise<HandlePaymentGatewayWebhookServiceResponse> {
    try {
      const payment = await this.findPayment(event);

      if (!payment) {
        return error(
          new PaymentNotFoundError(
            event.providerSessionId ??
              event.providerReferenceId ??
              event.providerName
          )
        );
      }

      payment.providerName = event.providerName;

      if (event.method !== undefined) {
        payment.method = event.method;
      }

      if (event.providerSessionId !== undefined) {
        payment.providerSessionId = event.providerSessionId;
      }

      if (event.providerReferenceId !== undefined) {
        payment.providerReferenceId = event.providerReferenceId;
      }

      if (event.providerCustomerId !== undefined) {
        payment.providerCustomerId = event.providerCustomerId;
      }

      if (event.providerPaymentMethodId !== undefined) {
        payment.providerPaymentMethodId = event.providerPaymentMethodId;
      }

      this.applyPaymentStatus(payment, event);

      await this.paymentsRepository.save(payment);

      return success({
        payment,
      });
    } catch {
      return error(new UnexpectedError());
    }
  }

  private async findPayment(event: PaymentGatewayWebhookEvent) {
    if (event.paymentId) {
      const payment = await this.paymentsRepository.findById(event.paymentId);

      if (payment) {
        return payment;
      }
    }

    if (event.providerSessionId) {
      const payment = await this.paymentsRepository.findByProviderSessionId(
        event.providerName,
        event.providerSessionId
      );

      if (payment) {
        return payment;
      }
    }

    if (event.providerReferenceId) {
      return this.paymentsRepository.findByProviderReferenceId(
        event.providerName,
        event.providerReferenceId
      );
    }

    return null;
  }

  private applyPaymentStatus(
    payment: Payment,
    event: PaymentGatewayWebhookEvent
  ) {
    if (event.status === PaymentStatus.PROCESSING) {
      payment.markAsProcessing(event.providerStatus);
    }

    if (event.status === PaymentStatus.PAID) {
      payment.markAsPaid(event.occurredAt, event.providerStatus);
    }

    if (event.status === PaymentStatus.FAILED) {
      payment.markAsFailed(event.failureReason, event.providerStatus);
    }

    if (event.status === PaymentStatus.CANCELED) {
      payment.markAsCanceled(event.occurredAt, event.providerStatus);
    }

    if (event.status === PaymentStatus.REFUNDED) {
      payment.markAsRefunded(event.occurredAt, event.providerStatus);
    }
  }
}
