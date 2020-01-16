"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("./core");
const enums_1 = require("./enums");
const utils_1 = require("./utils");
class AccessControl {
    constructor(grants) {
        this._isLocked = false;
        if (arguments.length === 0)
            grants = {};
        this.setGrants(grants);
    }
    get isLocked() {
        return this._isLocked && Object.isFrozen(this._grants);
    }
    getGrants() {
        return this._grants;
    }
    setGrants(grantsObject) {
        if (this.isLocked)
            throw new core_1.AccessControlError(utils_1.ERR_LOCK);
        this._grants = utils_1.utils.getInspectedGrants(grantsObject);
        return this;
    }
    reset() {
        if (this.isLocked)
            throw new core_1.AccessControlError(utils_1.ERR_LOCK);
        this._grants = {};
        return this;
    }
    lock() {
        utils_1.utils.lockAC(this);
        return this;
    }
    extendRole(roles, extenderRoles) {
        if (this.isLocked)
            throw new core_1.AccessControlError(utils_1.ERR_LOCK);
        utils_1.utils.extendRole(this._grants, roles, extenderRoles);
        return this;
    }
    removeRoles(roles) {
        if (this.isLocked)
            throw new core_1.AccessControlError(utils_1.ERR_LOCK);
        const rolesToRemove = utils_1.utils.toStringArray(roles);
        if (rolesToRemove.length === 0 || !utils_1.utils.isFilledStringArray(rolesToRemove)) {
            throw new core_1.AccessControlError(`Invalid role(s): ${JSON.stringify(roles)}`);
        }
        rolesToRemove.forEach((roleName) => {
            if (!this._grants[roleName]) {
                throw new core_1.AccessControlError(`Cannot remove a non-existing role: "${roleName}"`);
            }
            delete this._grants[roleName];
        });
        utils_1.utils.eachRole(this._grants, (roleItem, _) => {
            if (Array.isArray(roleItem.$extend)) {
                roleItem.$extend = utils_1.utils.subtractArray(roleItem.$extend, rolesToRemove);
            }
        });
        return this;
    }
    removeResources(resources, roles) {
        if (this.isLocked)
            throw new core_1.AccessControlError(utils_1.ERR_LOCK);
        this._removePermission(resources, roles);
        return this;
    }
    getRoles() {
        return Object.keys(this._grants);
    }
    getInheritedRolesOf(role) {
        const roles = utils_1.utils.getRoleHierarchyOf(this._grants, role);
        roles.shift();
        return roles;
    }
    getExtendedRolesOf(role) {
        return this.getInheritedRolesOf(role);
    }
    getResources() {
        return utils_1.utils.getResources(this._grants);
    }
    hasRole(role) {
        if (Array.isArray(role)) {
            return role.every((item) => this._grants.hasOwnProperty(item));
        }
        return this._grants.hasOwnProperty(role);
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
        return new core_1.Query(this._grants, role);
    }
    query(role) {
        return this.can(role);
    }
    permission(queryInfo) {
        return new core_1.Permission(this._grants, queryInfo);
    }
    grant(role) {
        if (this.isLocked)
            throw new core_1.AccessControlError(utils_1.ERR_LOCK);
        if (arguments.length !== 0 && role === undefined) {
            throw new core_1.AccessControlError('Invalid role(s): undefined');
        }
        return new core_1.Access(this, role, false);
    }
    allow(role) {
        return this.grant(role);
    }
    deny(role) {
        if (this.isLocked)
            throw new core_1.AccessControlError(utils_1.ERR_LOCK);
        if (arguments.length !== 0 && role === undefined) {
            throw new core_1.AccessControlError('Invalid role(s): undefined');
        }
        return new core_1.Access(this, role, true);
    }
    reject(role) {
        return this.deny(role);
    }
    _removePermission(resources, roles, actionPossession) {
        resources = utils_1.utils.toStringArray(resources);
        if (resources.length === 0 || !utils_1.utils.isFilledStringArray(resources)) {
            throw new core_1.AccessControlError(`Invalid resource(s): ${JSON.stringify(resources)}`);
        }
        if (roles !== undefined) {
            roles = utils_1.utils.toStringArray(roles);
            if (roles.length === 0 || !utils_1.utils.isFilledStringArray(roles)) {
                throw new core_1.AccessControlError(`Invalid role(s): ${JSON.stringify(roles)}`);
            }
        }
        utils_1.utils.eachRoleResource(this._grants, (role, resource, _) => {
            if (resources.indexOf(resource) >= 0
                && (!roles || roles.indexOf(role) >= 0)) {
                if (actionPossession) {
                    const ap = utils_1.utils.normalizeActionPossession({ action: actionPossession }, true);
                    delete this._grants[role][resource][ap];
                }
                else {
                    delete this._grants[role][resource];
                }
            }
        });
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
    static filter(data, attributes) {
        return utils_1.utils.filterAll(data, attributes);
    }
    static isACError(object) {
        return object instanceof core_1.AccessControlError;
    }
    static isAccessControlError(object) {
        return AccessControl.isACError(object);
    }
}
exports.AccessControl = AccessControl;
//# sourceMappingURL=AccessControl.js.map