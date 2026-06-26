export class OrderMustHaveItemsError extends Error {
  constructor() {
    super('An order must keep at least one item.');
  }
}
