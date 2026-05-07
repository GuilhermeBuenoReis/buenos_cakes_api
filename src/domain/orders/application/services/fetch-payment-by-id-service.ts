import { type Either, error, success } from '../../../../core/either';
import { UnexpectedError } from '../../../../core/errors/unexpected-error';
import type { Payment } from '../../enterprise/entities/payment';
import { PaymentNotFoundError } from '../errors/payment-not-found-error';
import type { PaymentsRepository } from '../repositories/payments-repository';

export interface FetchPaymentByIdServiceRequest {
  paymentId: string;
}

export type FetchPaymentByIdServiceResponse = Either<
  PaymentNotFoundError | UnexpectedError,
  {
    payment: Payment;
  }
>;

export class FetchPaymentByIdService {
  constructor(private paymentsRepository: PaymentsRepository) {}

  async execute({
    paymentId,
  }: FetchPaymentByIdServiceRequest): Promise<FetchPaymentByIdServiceResponse> {
    try {
      const payment = await this.paymentsRepository.findById(paymentId);

      if (!payment) {
        return error(new PaymentNotFoundError(paymentId));
      }

      return success({
        payment,
      });
    } catch {
      return error(new UnexpectedError());
    }
  }
}
