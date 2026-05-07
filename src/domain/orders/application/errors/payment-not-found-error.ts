export class PaymentNotFoundError extends Error {
  constructor(id: string) {
    super(`Payment with id "${id}" does not exist.`);
  }
}
