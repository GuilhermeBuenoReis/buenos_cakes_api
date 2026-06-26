export class OrderDoesNotBelongToUserError extends Error {
  constructor() {
    super('This order does not belong to the authenticated user.');
  }
}
