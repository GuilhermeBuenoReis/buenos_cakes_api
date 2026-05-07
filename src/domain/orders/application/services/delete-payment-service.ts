import { type Either, error, success } from '../../../../core/either';
import { UnexpectedError } from '../../../../core/errors/unexpected-error';
import { PaymentNotFoundError } from '../errors/payment-not-found-error';
import type { PaymentsRepository } from '../repositories/payments-repository';

export interface DeletePaymentServiceRequest {
  paymentId: string;
}

export type DeletePaymentServiceResponse = Either<
  PaymentNotFoundError | UnexpectedError,
  {
    message: string;
  }
>;

export class DeletePaymentService {
  constructor(private paymentsRepository: PaymentsRepository) {}

  async execute({
    paymentId,
  }: DeletePaymentServiceRequest): Promise<DeletePaymentServiceResponse> {
    try {
      const payment = await this.paymentsRepository.findById(paymentId);

      if (!payment) {
        return error(new PaymentNotFoundError(paymentId));
      }

      await this.paymentsRepository.delete(payment);

      return success({
        message: 'Payment deleted successfully.',
      });
    } catch {
      return error(new UnexpectedError());
    }
  }
}
