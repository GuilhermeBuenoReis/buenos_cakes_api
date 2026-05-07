import { type Either, error, success } from '../../../../core/either';
import { UnexpectedError } from '../../../../core/errors/unexpected-error';
import type { Payment } from '../../enterprise/entities/payment';
import { PaymentNotFoundError } from '../errors/payment-not-found-error';
import type { PaymentsRepository } from '../repositories/payments-repository';

export interface FetchPaymentByProviderSessionServiceRequest {
  providerName: string;
  providerSessionId: string;
}

export type FetchPaymentByProviderSessionServiceResponse = Either<
  PaymentNotFoundError | UnexpectedError,
  {
    payment: Payment;
  }
>;

export class FetchPaymentByProviderSessionService {
  constructor(private paymentsRepository: PaymentsRepository) {}

  async execute({
    providerName,
    providerSessionId,
  }: FetchPaymentByProviderSessionServiceRequest): Promise<FetchPaymentByProviderSessionServiceResponse> {
    try {
      const payment = await this.paymentsRepository.findByProviderSessionId(
        providerName,
        providerSessionId
      );

      if (!payment) {
        return error(new PaymentNotFoundError(providerSessionId));
      }

      return success({
        payment,
      });
    } catch {
      return error(new UnexpectedError());
    }
  }
}
