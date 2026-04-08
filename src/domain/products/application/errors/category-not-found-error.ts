export class CategoryNotFoundError extends Error {
  constructor(id: string) {
    super(`Category with id "${id}" does not exist.`);
  }
}
