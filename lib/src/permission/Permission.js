"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Permission = void 0;
const utils_1 = require("../utils");
class Permission {
    constructor(grants, query) {
        this._ = {};
        this._.attributes = utils_1.getUnionAttrsOfRoles(grants, query);
        this._.role = query.role;
        this._.resource = query.resource;
    }
    get roles() {
        return this._.role;
    }
    get resource() {
        return this._.resource;
    }
    get attributes() {
        return this._.attributes;
    }
    get granted() {
        if (!this.attributes || this.attributes.length === 0)
            return false;
        return this.attributes.some((attr) => {
            return attr.trim().slice(0, 1) !== '!';
        });
    }
}
exports.Permission = Permission;
//# sourceMappingURL=Permission.js.map