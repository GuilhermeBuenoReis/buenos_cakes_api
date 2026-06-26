export class ProductNotAvailableError extends Error {
  constructor(id: string) {
    super(`Product with id "${id}" is not available.`);
  }
}
