import type { Payment } from '../../enterprise/entities/payment';

export interface PaymentsRepository {
  findById(id: string): Promise<Payment | null>;
  findManyByOrderId(orderId: string): Promise<Payment[]>;
  findByProviderReferenceId(
    providerName: string,
    providerReferenceId: string
  ): Promise<Payment | null>;
  findByProviderSessionId(
    providerName: string,
    providerSessionId: string
  ): Promise<Payment | null>;
  create(payment: Payment): Promise<Payment>;
  save(payment: Payment): Promise<Payment>;
  delete(payment: Payment): Promise<void>;
}
