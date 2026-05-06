export class DeliveryAddressRequiredError extends Error {
  constructor() {
    super('Delivery address is required for delivery orders.');
  }
}
