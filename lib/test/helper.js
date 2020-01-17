"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const src_1 = require("../src");
const core_1 = require("../src/core");
const helper = {
    expectAccessControlError(fn, errMsg) {
        expect(fn).toThrow();
        try {
            fn();
        }
        catch (err) {
            expect(err instanceof src_1.AccessControl.Error).toEqual(true);
            expect(err instanceof core_1.AccessControlError).toEqual(true);
            expect(src_1.AccessControl.isAccessControlError(err)).toEqual(true);
            if (errMsg)
                expect(err.message).toContain(errMsg);
        }
    },
};
exports.helper = helper;
//# sourceMappingURL=helper.js.map