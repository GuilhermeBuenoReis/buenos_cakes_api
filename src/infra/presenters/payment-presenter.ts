import { UniqueEntityID } from '@/core/entities/unique-entity-id';
import {
  Payment,
  type PaymentMethod,
  type PaymentProvider,
  type PaymentStatus,
} from '@/domain/orders/enterprise/entities/payment';
import type { payments } from '../db/schema/payments';

type DrizzlePayment = typeof payments.$inferSelect;

export class PaymentPresenter {
  static toDomain(payment: DrizzlePayment): Payment {
    return Payment.create(
      {
        orderId: new UniqueEntityID(payment.orderId),
        method: payment.method as PaymentMethod | null,
        provider: payment.provider as PaymentProvider,
        status: payment.status as PaymentStatus,
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
      },
      new UniqueEntityID(payment.id)
    );
  }

  static toHTTP(payment: Payment) {
    return {
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
      expiresAt: payment.expiresAt?.toISOString() ?? null,
      failureReason: payment.failureReason,
      paidAt: payment.paidAt?.toISOString() ?? null,
      canceledAt: payment.canceledAt?.toISOString() ?? null,
      refundedAt: payment.refundedAt?.toISOString() ?? null,
      createdAt: payment.createdAt.toISOString(),
      updatedAt: payment.updatedAt?.toISOString() ?? null,
    };
  }
}
