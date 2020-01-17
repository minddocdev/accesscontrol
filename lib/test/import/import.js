"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const src_1 = require("../../src");
console.log(src_1.AccessControl);
const ac = new src_1.AccessControl();
ac.setGrants({
    user: {
        resource: {
            'create:any': ['*'],
        },
    },
});
console.log(ac.getGrants());
//# sourceMappingURL=import.js.map