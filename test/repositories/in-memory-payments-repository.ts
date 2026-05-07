import type { PaymentsRepository } from '../../src/domain/orders/application/repositories/payments-repository';
import type { Payment } from '../../src/domain/orders/enterprise/entities/payment';

export class InMemoryPaymentsRepository implements PaymentsRepository {
  public items: Payment[] = [];

  async findById(id: string): Promise<Payment | null> {
    const payment = this.items.find((item) => item.id.toString() === id);

    if (!payment) {
      return null;
    }

    return payment;
  }

  async findManyByOrderId(orderId: string): Promise<Payment[]> {
    return this.items.filter((item) => item.orderId.toString() === orderId);
  }

  async findByProviderReferenceId(
    providerName: string,
    providerReferenceId: string
  ): Promise<Payment | null> {
    const payment = this.items.find(
      (item) =>
        item.providerName === providerName &&
        item.providerReferenceId === providerReferenceId
    );

    if (!payment) {
      return null;
    }

    return payment;
  }

  async findByProviderSessionId(
    providerName: string,
    providerSessionId: string
  ): Promise<Payment | null> {
    const payment = this.items.find(
      (item) =>
        item.providerName === providerName &&
        item.providerSessionId === providerSessionId
    );

    if (!payment) {
      return null;
    }

    return payment;
  }

  async create(payment: Payment): Promise<Payment> {
    this.items.push(payment);

    return payment;
  }

  async save(payment: Payment): Promise<Payment> {
    const paymentIndex = this.items.findIndex((item) =>
      item.id.equals(payment.id)
    );

    this.items[paymentIndex] = payment;

    return payment;
  }

  async delete(payment: Payment): Promise<void> {
    const paymentIndex = this.items.findIndex((item) =>
      item.id.equals(payment.id)
    );

    this.items.splice(paymentIndex, 1);
  }
}
