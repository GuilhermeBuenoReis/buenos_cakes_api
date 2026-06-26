export class OrderStatusNotEditableError extends Error {
  constructor(status: string) {
    super(`Orders with status "${status}" can no longer be changed.`);
  }
}
