import type { PaymentsRepository } from '../../../src/domain/orders/application/repositories/payments-repository';
import type { Payment } from '../../../src/domain/orders/enterprise/entities/payment';

export class FailingPaymentsRepository implements PaymentsRepository {
  async findById(_id: string): Promise<Payment | null> {
    throw new Error('Unexpected repository error.');
  }

  async findManyByOrderId(_orderId: string): Promise<Payment[]> {
    throw new Error('Unexpected repository error.');
  }

  async findByProviderReferenceId(
    _providerName: string,
    _providerReferenceId: string
  ): Promise<Payment | null> {
    throw new Error('Unexpected repository error.');
  }

  async findByProviderSessionId(
    _providerName: string,
    _providerSessionId: string
  ): Promise<Payment | null> {
    throw new Error('Unexpected repository error.');
  }

  async create(_payment: Payment): Promise<Payment> {
    throw new Error('Unexpected repository error.');
  }

  async save(_payment: Payment): Promise<Payment> {
    throw new Error('Unexpected repository error.');
  }

  async delete(_payment: Payment): Promise<void> {
    throw new Error('Unexpected repository error.');
  }
}
