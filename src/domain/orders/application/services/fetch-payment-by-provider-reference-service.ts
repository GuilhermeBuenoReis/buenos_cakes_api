import { type Either, error, success } from '../../../../core/either';
import { UnexpectedError } from '../../../../core/errors/unexpected-error';
import type { Payment } from '../../enterprise/entities/payment';
import { PaymentNotFoundError } from '../errors/payment-not-found-error';
import type { PaymentsRepository } from '../repositories/payments-repository';

export interface FetchPaymentByProviderReferenceServiceRequest {
  providerName: string;
  providerReferenceId: string;
}

export type FetchPaymentByProviderReferenceServiceResponse = Either<
  PaymentNotFoundError | UnexpectedError,
  {
    payment: Payment;
  }
>;

export class FetchPaymentByProviderReferenceService {
  constructor(private paymentsRepository: PaymentsRepository) {}

  async execute({
    providerName,
    providerReferenceId,
  }: FetchPaymentByProviderReferenceServiceRequest): Promise<FetchPaymentByProviderReferenceServiceResponse> {
    try {
      const payment = await this.paymentsRepository.findByProviderReferenceId(
        providerName,
        providerReferenceId
      );

      if (!payment) {
        return error(new PaymentNotFoundError(providerReferenceId));
      }

      return success({
        payment,
      });
    } catch {
      return error(new UnexpectedError());
    }
  }
}
