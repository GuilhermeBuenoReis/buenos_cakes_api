import { type Either, error, success } from '../../../../core/either';
import { UnexpectedError } from '../../../../core/errors/unexpected-error';
import type { Payment } from '../../enterprise/entities/payment';
import { PaymentStatus } from '../../enterprise/entities/payment';
import { PaymentNotFoundError } from '../errors/payment-not-found-error';
import type { PaymentsRepository } from '../repositories/payments-repository';

export interface UpdatePaymentStatusServiceRequest {
  paymentId: string;
  status: Exclude<PaymentStatus, PaymentStatus.PENDING>;
  providerStatus?: string | null;
  failureReason?: string | null;
  occurredAt?: Date;
}

export type UpdatePaymentStatusServiceResponse = Either<
  PaymentNotFoundError | UnexpectedError,
  {
    payment: Payment;
  }
>;

export class UpdatePaymentStatusService {
  constructor(private paymentsRepository: PaymentsRepository) {}

  async execute({
    paymentId,
    status,
    providerStatus,
    failureReason,
    occurredAt,
  }: UpdatePaymentStatusServiceRequest): Promise<UpdatePaymentStatusServiceResponse> {
    try {
      const payment = await this.paymentsRepository.findById(paymentId);

      if (!payment) {
        return error(new PaymentNotFoundError(paymentId));
      }

      if (status === PaymentStatus.PROCESSING) {
        payment.markAsProcessing(providerStatus);
      }

      if (status === PaymentStatus.PAID) {
        payment.markAsPaid(occurredAt, providerStatus);
      }

      if (status === PaymentStatus.FAILED) {
        payment.markAsFailed(failureReason, providerStatus);
      }

      if (status === PaymentStatus.CANCELED) {
        payment.markAsCanceled(occurredAt, providerStatus);
      }

      if (status === PaymentStatus.REFUNDED) {
        payment.markAsRefunded(occurredAt, providerStatus);
      }

      await this.paymentsRepository.save(payment);

      return success({
        payment,
      });
    } catch {
      return error(new UnexpectedError());
    }
  }
}
