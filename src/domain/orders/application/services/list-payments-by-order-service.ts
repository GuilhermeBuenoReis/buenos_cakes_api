import { type Either, error, success } from '../../../../core/either';
import { UnexpectedError } from '../../../../core/errors/unexpected-error';
import type { Payment } from '../../enterprise/entities/payment';
import type { PaymentsRepository } from '../repositories/payments-repository';

export interface ListPaymentsByOrderServiceRequest {
  orderId: string;
}

export type ListPaymentsByOrderServiceResponse = Either<
  UnexpectedError,
  {
    payments: Payment[];
  }
>;

export class ListPaymentsByOrderService {
  constructor(private paymentsRepository: PaymentsRepository) {}

  async execute({
    orderId,
  }: ListPaymentsByOrderServiceRequest): Promise<ListPaymentsByOrderServiceResponse> {
    try {
      const payments = await this.paymentsRepository.findManyByOrderId(orderId);

      return success({
        payments,
      });
    } catch {
      return error(new UnexpectedError());
    }
  }
}
