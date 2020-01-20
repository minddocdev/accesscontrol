import { AccessControl, AccessControlError } from '../src';

const helper = {
  expectAccessControlError(fn: any, errMsg?: string) {
    expect(fn).toThrow();
    try {
      fn();
    } catch (err) {
      expect(err instanceof AccessControl.Error).toEqual(true);
      expect(err instanceof AccessControlError).toEqual(true);
      expect(AccessControl.isAccessControlError(err)).toEqual(true);
      if (errMsg) expect(err.message).toContain(errMsg);
    }
  },
};

export { helper };
