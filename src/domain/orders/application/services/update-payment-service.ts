import { type Either, error, success } from '../../../../core/either';
import { UnexpectedError } from '../../../../core/errors/unexpected-error';
import type {
  Payment,
  PaymentMethod,
  PaymentProvider,
} from '../../enterprise/entities/payment';
import { PaymentNotFoundError } from '../errors/payment-not-found-error';
import type { PaymentsRepository } from '../repositories/payments-repository';

export interface UpdatePaymentServiceRequest {
  paymentId: string;
  method?: PaymentMethod | null;
  provider?: PaymentProvider;
  amount?: number;
  currency?: string;
  providerName?: string | null;
  providerReferenceId?: string | null;
  providerSessionId?: string | null;
  providerCustomerId?: string | null;
  providerPaymentMethodId?: string | null;
  providerClientSecret?: string | null;
  providerStatus?: string | null;
  pixQrCode?: string | null;
  pixQrCodeUrl?: string | null;
  expiresAt?: Date | null;
}

export type UpdatePaymentServiceResponse = Either<
  PaymentNotFoundError | UnexpectedError,
  {
    payment: Payment;
  }
>;

export class UpdatePaymentService {
  constructor(private paymentsRepository: PaymentsRepository) {}

  async execute({
    paymentId,
    method,
    provider,
    amount,
    currency,
    providerName,
    providerReferenceId,
    providerSessionId,
    providerCustomerId,
    providerPaymentMethodId,
    providerClientSecret,
    providerStatus,
    pixQrCode,
    pixQrCodeUrl,
    expiresAt,
  }: UpdatePaymentServiceRequest): Promise<UpdatePaymentServiceResponse> {
    try {
      const payment = await this.paymentsRepository.findById(paymentId);

      if (!payment) {
        return error(new PaymentNotFoundError(paymentId));
      }

      if (method !== undefined) payment.method = method;
      if (provider !== undefined) payment.provider = provider;
      if (amount !== undefined) payment.amount = amount;
      if (currency !== undefined) payment.currency = currency;
      if (providerName !== undefined) payment.providerName = providerName;
      if (providerReferenceId !== undefined) {
        payment.providerReferenceId = providerReferenceId;
      }
      if (providerSessionId !== undefined) {
        payment.providerSessionId = providerSessionId;
      }
      if (providerCustomerId !== undefined) {
        payment.providerCustomerId = providerCustomerId;
      }
      if (providerPaymentMethodId !== undefined) {
        payment.providerPaymentMethodId = providerPaymentMethodId;
      }
      if (providerClientSecret !== undefined) {
        payment.providerClientSecret = providerClientSecret;
      }
      if (providerStatus !== undefined) payment.providerStatus = providerStatus;
      if (pixQrCode !== undefined) payment.pixQrCode = pixQrCode;
      if (pixQrCodeUrl !== undefined) payment.pixQrCodeUrl = pixQrCodeUrl;
      if (expiresAt !== undefined) payment.expiresAt = expiresAt;

      await this.paymentsRepository.save(payment);

      return success({
        payment,
      });
    } catch {
      return error(new UnexpectedError());
    }
  }
}
