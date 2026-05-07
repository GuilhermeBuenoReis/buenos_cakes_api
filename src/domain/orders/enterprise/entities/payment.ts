import { Entity } from '../../../../core/entities/entity';
import type { UniqueEntityID } from '../../../../core/entities/unique-entity-id';
import type { Optional } from '../../../../core/types/optional';

export enum PaymentMethod {
  PIX = 'pix',
  CREDIT_CARD = 'credit_card',
  DEBIT_CARD = 'debit_card',
  CASH = 'cash',
}

export enum PaymentProvider {
  EXTERNAL = 'external',
  MANUAL = 'manual',
}

export enum PaymentStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  PAID = 'paid',
  FAILED = 'failed',
  CANCELED = 'canceled',
  REFUNDED = 'refunded',
}

interface PaymentProps {
  orderId: UniqueEntityID;
  method: PaymentMethod;
  provider: PaymentProvider;
  status: PaymentStatus;
  amount: number;
  currency: string;

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
  failureReason?: string | null;

  paidAt?: Date | null;
  canceledAt?: Date | null;
  refundedAt?: Date | null;
  createdAt: Date;
  updatedAt?: Date | null;
}

export class Payment extends Entity<PaymentProps> {
  get orderId() {
    return this.props.orderId;
  }

  get method() {
    return this.props.method;
  }

  get provider() {
    return this.props.provider;
  }

  get status() {
    return this.props.status;
  }

  get amount() {
    return this.props.amount;
  }

  get currency() {
    return this.props.currency;
  }

  get providerName() {
    return this.props.providerName;
  }

  get providerReferenceId() {
    return this.props.providerReferenceId;
  }

  get providerSessionId() {
    return this.props.providerSessionId;
  }

  get providerCustomerId() {
    return this.props.providerCustomerId;
  }

  get providerPaymentMethodId() {
    return this.props.providerPaymentMethodId;
  }

  get providerClientSecret() {
    return this.props.providerClientSecret;
  }

  get providerStatus() {
    return this.props.providerStatus;
  }

  get pixQrCode() {
    return this.props.pixQrCode;
  }

  get pixQrCodeUrl() {
    return this.props.pixQrCodeUrl;
  }

  get expiresAt() {
    return this.props.expiresAt;
  }

  get failureReason() {
    return this.props.failureReason;
  }

  get paidAt() {
    return this.props.paidAt;
  }

  get canceledAt() {
    return this.props.canceledAt;
  }

  get refundedAt() {
    return this.props.refundedAt;
  }

  get createdAt() {
    return this.props.createdAt;
  }

  get updatedAt() {
    return this.props.updatedAt;
  }

  private touch() {
    this.props.updatedAt = new Date();
  }

  set method(method: PaymentMethod) {
    this.props.method = method;
    this.touch();
  }

  set provider(provider: PaymentProvider) {
    this.props.provider = provider;
    this.touch();
  }

  set amount(amount: number) {
    this.props.amount = amount;
    this.touch();
  }

  set currency(currency: string) {
    this.props.currency = currency;
    this.touch();
  }

  set providerName(providerName: string | null | undefined) {
    this.props.providerName = providerName ?? null;
    this.touch();
  }

  set providerReferenceId(providerReferenceId: string | null | undefined) {
    this.props.providerReferenceId = providerReferenceId ?? null;
    this.touch();
  }

  set providerSessionId(providerSessionId: string | null | undefined) {
    this.props.providerSessionId = providerSessionId ?? null;
    this.touch();
  }

  set providerCustomerId(providerCustomerId: string | null | undefined) {
    this.props.providerCustomerId = providerCustomerId ?? null;
    this.touch();
  }

  set providerPaymentMethodId(providerPaymentMethodId:
    | string
    | null
    | undefined) {
    this.props.providerPaymentMethodId = providerPaymentMethodId ?? null;
    this.touch();
  }

  set providerClientSecret(providerClientSecret: string | null | undefined) {
    this.props.providerClientSecret = providerClientSecret ?? null;
    this.touch();
  }

  set providerStatus(providerStatus: string | null | undefined) {
    this.props.providerStatus = providerStatus ?? null;
    this.touch();
  }

  set pixQrCode(pixQrCode: string | null | undefined) {
    this.props.pixQrCode = pixQrCode ?? null;
    this.touch();
  }

  set pixQrCodeUrl(pixQrCodeUrl: string | null | undefined) {
    this.props.pixQrCodeUrl = pixQrCodeUrl ?? null;
    this.touch();
  }

  set expiresAt(expiresAt: Date | null | undefined) {
    this.props.expiresAt = expiresAt ?? null;
    this.touch();
  }

  markAsProcessing(providerStatus?: string | null) {
    this.props.status = PaymentStatus.PROCESSING;
    this.props.providerStatus =
      providerStatus ?? this.props.providerStatus ?? null;
    this.props.failureReason = null;
    this.touch();
  }

  markAsPaid(paidAt = new Date(), providerStatus?: string | null) {
    this.props.status = PaymentStatus.PAID;
    this.props.paidAt = paidAt;
    this.props.providerStatus =
      providerStatus ?? this.props.providerStatus ?? null;
    this.props.failureReason = null;
    this.touch();
  }

  markAsFailed(reason?: string | null, providerStatus?: string | null) {
    this.props.status = PaymentStatus.FAILED;
    this.props.failureReason = reason ?? null;
    this.props.providerStatus =
      providerStatus ?? this.props.providerStatus ?? null;
    this.touch();
  }

  markAsCanceled(canceledAt = new Date(), providerStatus?: string | null) {
    this.props.status = PaymentStatus.CANCELED;
    this.props.canceledAt = canceledAt;
    this.props.providerStatus =
      providerStatus ?? this.props.providerStatus ?? null;
    this.touch();
  }

  markAsRefunded(refundedAt = new Date(), providerStatus?: string | null) {
    this.props.status = PaymentStatus.REFUNDED;
    this.props.refundedAt = refundedAt;
    this.props.providerStatus =
      providerStatus ?? this.props.providerStatus ?? null;
    this.touch();
  }

  static create(
    props: Optional<
      PaymentProps,
      | 'provider'
      | 'status'
      | 'currency'
      | 'providerName'
      | 'providerReferenceId'
      | 'providerSessionId'
      | 'providerCustomerId'
      | 'providerPaymentMethodId'
      | 'providerClientSecret'
      | 'providerStatus'
      | 'pixQrCode'
      | 'pixQrCodeUrl'
      | 'expiresAt'
      | 'failureReason'
      | 'paidAt'
      | 'canceledAt'
      | 'refundedAt'
      | 'createdAt'
      | 'updatedAt'
    >,
    id?: UniqueEntityID
  ) {
    const payment = new Payment(
      {
        ...props,
        provider:
          props.provider ??
          (props.method === PaymentMethod.CASH
            ? PaymentProvider.MANUAL
            : PaymentProvider.EXTERNAL),
        status: props.status ?? PaymentStatus.PENDING,
        currency: props.currency ?? 'brl',
        providerName: props.providerName ?? null,
        providerReferenceId: props.providerReferenceId ?? null,
        providerSessionId: props.providerSessionId ?? null,
        providerCustomerId: props.providerCustomerId ?? null,
        providerPaymentMethodId: props.providerPaymentMethodId ?? null,
        providerClientSecret: props.providerClientSecret ?? null,
        providerStatus: props.providerStatus ?? null,
        pixQrCode: props.pixQrCode ?? null,
        pixQrCodeUrl: props.pixQrCodeUrl ?? null,
        expiresAt: props.expiresAt ?? null,
        failureReason: props.failureReason ?? null,
        paidAt: props.paidAt ?? null,
        canceledAt: props.canceledAt ?? null,
        refundedAt: props.refundedAt ?? null,
        createdAt: props.createdAt ?? new Date(),
        updatedAt: props.updatedAt ?? null,
      },
      id
    );

    return payment;
  }
}
