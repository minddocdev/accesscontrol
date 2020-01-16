"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const src_1 = require("../../src");
console.log(src_1.AccessControl);
const ac = new src_1.AccessControl();
ac.grant('user').createAny('resource');
console.log(ac.getGrants());
//# sourceMappingURL=import.js.map