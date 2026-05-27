import { and, eq } from 'drizzle-orm';

import type { PaymentsRepository } from '@/domain/orders/application/repositories/payments-repository';
import type { Payment } from '@/domain/orders/enterprise/entities/payment';
import { PaymentPresenter } from '@/infra/presenters/payment-presenter';
import { db } from '..';
import { payments } from '../schema/payments';

export class DrizzlePaymentsRepository implements PaymentsRepository {
  async findById(id: string): Promise<Payment | null> {
    const payment = await db.query.payments.findFirst({
      where: eq(payments.id, id),
    });

    if (!payment) {
      return null;
    }

    return PaymentPresenter.toDomain(payment);
  }

  async findManyByOrderId(orderId: string): Promise<Payment[]> {
    const orderPayments = await db.query.payments.findMany({
      where: eq(payments.orderId, orderId),
    });

    return orderPayments.map(PaymentPresenter.toDomain);
  }

  async findByProviderReferenceId(
    providerName: string,
    providerReferenceId: string
  ): Promise<Payment | null> {
    const payment = await db.query.payments.findFirst({
      where: and(
        eq(payments.providerName, providerName),
        eq(payments.providerReferenceId, providerReferenceId)
      ),
    });

    if (!payment) {
      return null;
    }

    return PaymentPresenter.toDomain(payment);
  }

  async findByProviderSessionId(
    providerName: string,
    providerSessionId: string
  ): Promise<Payment | null> {
    const payment = await db.query.payments.findFirst({
      where: and(
        eq(payments.providerName, providerName),
        eq(payments.providerSessionId, providerSessionId)
      ),
    });

    if (!payment) {
      return null;
    }

    return PaymentPresenter.toDomain(payment);
  }

  async create(payment: Payment): Promise<Payment> {
    const [created] = await db
      .insert(payments)
      .values({
        id: payment.id.toString(),
        orderId: payment.orderId.toString(),
        method: payment.method,
        provider: payment.provider,
        status: payment.status,
        amount: payment.amount,
        currency: payment.currency,
        providerName: payment.providerName,
        providerReferenceId: payment.providerReferenceId,
        providerSessionId: payment.providerSessionId,
        providerCustomerId: payment.providerCustomerId,
        providerPaymentMethodId: payment.providerPaymentMethodId,
        providerClientSecret: payment.providerClientSecret,
        providerStatus: payment.providerStatus,
        pixQrCode: payment.pixQrCode,
        pixQrCodeUrl: payment.pixQrCodeUrl,
        expiresAt: payment.expiresAt,
        failureReason: payment.failureReason,
        paidAt: payment.paidAt,
        canceledAt: payment.canceledAt,
        refundedAt: payment.refundedAt,
        createdAt: payment.createdAt,
        updatedAt: payment.updatedAt,
      })
      .returning();

    if (!created) {
      throw new Error('Failed to create payment.');
    }

    return PaymentPresenter.toDomain(created);
  }

  async save(payment: Payment): Promise<Payment> {
    const [updatedPayment] = await db
      .update(payments)
      .set({
        orderId: payment.orderId.toString(),
        method: payment.method,
        provider: payment.provider,
        status: payment.status,
        amount: payment.amount,
        currency: payment.currency,
        providerName: payment.providerName,
        providerReferenceId: payment.providerReferenceId,
        providerSessionId: payment.providerSessionId,
        providerCustomerId: payment.providerCustomerId,
        providerPaymentMethodId: payment.providerPaymentMethodId,
        providerClientSecret: payment.providerClientSecret,
        providerStatus: payment.providerStatus,
        pixQrCode: payment.pixQrCode,
        pixQrCodeUrl: payment.pixQrCodeUrl,
        expiresAt: payment.expiresAt,
        failureReason: payment.failureReason,
        paidAt: payment.paidAt,
        canceledAt: payment.canceledAt,
        refundedAt: payment.refundedAt,
        updatedAt: new Date(),
      })
      .where(eq(payments.id, payment.id.toString()))
      .returning();

    if (!updatedPayment) {
      throw new Error('Failed to update payment.');
    }

    return PaymentPresenter.toDomain(updatedPayment);
  }

  async delete(payment: Payment): Promise<void> {
    await db.delete(payments).where(eq(payments.id, payment.id.toString()));
  }
}
