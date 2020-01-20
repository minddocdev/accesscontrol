export class AccessControlError extends Error {
  public name: string = 'AccessControlError';
  /* istanbul ignore next */
  constructor(public message: string = '') {
    super(message);
    Object.setPrototypeOf(this, AccessControlError.prototype);
  }
}
