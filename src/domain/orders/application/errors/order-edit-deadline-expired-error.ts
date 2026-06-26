export class OrderEditDeadlineExpiredError extends Error {
  constructor() {
    super(
      'Orders can only be changed up to 24 hours before the scheduled pickup or delivery.'
    );
  }
}
