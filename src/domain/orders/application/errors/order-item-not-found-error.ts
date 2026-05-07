export class OrderItemNotFoundError extends Error {
  constructor(id: string) {
    super(`Order item with id "${id}" does not exist.`);
  }
}
