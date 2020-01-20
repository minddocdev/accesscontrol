"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class AccessControlError extends Error {
    constructor(message = '') {
        super(message);
        this.message = message;
        this.name = 'AccessControlError';
        Object.setPrototypeOf(this, AccessControlError.prototype);
    }
}
exports.AccessControlError = AccessControlError;
//# sourceMappingURL=AccessControlError.js.map