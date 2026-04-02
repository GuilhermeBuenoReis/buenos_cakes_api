export class AddressNotFoundError extends Error {
  constructor(id: string) {
    super(`Address with id "${id}" does not exist.`);
  }
}
