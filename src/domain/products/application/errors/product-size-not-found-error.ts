export class ProductSizeNotFoundError extends Error {
  constructor(id: string) {
    super(`Product size with id "${id}" does not exist.`);
  }
}
