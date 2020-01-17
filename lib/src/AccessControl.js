"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("./core");
const enums_1 = require("./enums");
const utils_1 = require("./utils");
class AccessControl {
    constructor(grants) {
        let initGrants = grants;
        if (arguments.length === 0) {
            initGrants = {};
        }
        this.setGrants(initGrants);
    }
    getGrants() {
        return this.grants;
    }
    setGrants(grantsObject) {
        this.grants = utils_1.getInspectedGrants(grantsObject);
        return this;
    }
    reset() {
        this.grants = {};
        return this;
    }
    getRoles() {
        return Object.keys(this.grants);
    }
    getResources() {
        return utils_1.getResources(this.grants);
    }
    hasRole(role) {
        if (!this.grants) {
            return false;
        }
        if (Array.isArray(role)) {
            return role.every((item) => this.grants.hasOwnProperty(item));
        }
        return this.grants.hasOwnProperty(role);
    }
    hasResource(resource) {
        const resources = this.getResources();
        if (Array.isArray(resource)) {
            return resource.every((item) => resources.indexOf(item) >= 0);
        }
        if (typeof resource !== 'string' || resource === '')
            return false;
        return resources.indexOf(resource) >= 0;
    }
    can(role) {
        if (arguments.length !== 0 && role === undefined) {
            throw new core_1.AccessControlError('Invalid role(s): undefined');
        }
        return new core_1.Query(this.grants, role);
    }
    permission(queryInfo) {
        return new core_1.Permission(this.grants, queryInfo);
    }
    grant(role) {
        if (arguments.length !== 0 && role === undefined) {
            throw new core_1.AccessControlError('Invalid role(s): undefined');
        }
        return new core_1.Access(this, role, false);
    }
    deny(role) {
        if (arguments.length !== 0 && role === undefined) {
            throw new core_1.AccessControlError('Invalid role(s): undefined');
        }
        return new core_1.Access(this, role, true);
    }
    static get Action() {
        return enums_1.Action;
    }
    static get Possession() {
        return enums_1.Possession;
    }
    static get Error() {
        return core_1.AccessControlError;
    }
    static isAccessControlError(object) {
        return object instanceof core_1.AccessControlError;
    }
}
exports.AccessControl = AccessControl;
//# sourceMappingURL=AccessControl.js.map