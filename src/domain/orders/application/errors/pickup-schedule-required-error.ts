export class PickupScheduleRequiredError extends Error {
  constructor() {
    super('Pickup schedule is required for pickup orders.');
  }
}
