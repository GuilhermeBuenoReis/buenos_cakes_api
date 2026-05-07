export class OrderNotFoundError extends Error {
  constructor(id: string) {
    super(`Order with id "${id}" does not exist.`);
  }
}
