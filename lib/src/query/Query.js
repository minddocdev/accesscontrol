"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Query = void 0;
const enums_1 = require("../enums");
const error_1 = require("../error");
const permission_1 = require("../permission");
const utils_1 = require("../utils");
class Query {
    constructor(grants, roleOrInfo) {
        this._ = {};
        this._grants = grants;
        if (typeof roleOrInfo === 'string' || Array.isArray(roleOrInfo)) {
            this.role(roleOrInfo);
        }
        else if (utils_1.type(roleOrInfo) === 'object') {
            if (Object.keys(roleOrInfo).length === 0) {
                throw new error_1.AccessControlError('Invalid IQueryInfo: {}');
            }
            this._ = roleOrInfo;
        }
        else if (roleOrInfo !== undefined) {
            throw new error_1.AccessControlError('Invalid role(s), expected a valid string, string[] or IQueryInfo.');
        }
    }
    role(role) {
        this._.role = role;
        return this;
    }
    resource(resource) {
        this._.resource = resource;
        return this;
    }
    createOwn(resource) {
        return this._getPermission(enums_1.Action.CREATE, enums_1.Possession.OWN, resource);
    }
    createAny(resource) {
        return this._getPermission(enums_1.Action.CREATE, enums_1.Possession.ANY, resource);
    }
    create(resource) {
        return this.createAny(resource);
    }
    readOwn(resource) {
        return this._getPermission(enums_1.Action.READ, enums_1.Possession.OWN, resource);
    }
    readAny(resource) {
        return this._getPermission(enums_1.Action.READ, enums_1.Possession.ANY, resource);
    }
    read(resource) {
        return this.readAny(resource);
    }
    updateOwn(resource) {
        return this._getPermission(enums_1.Action.UPDATE, enums_1.Possession.OWN, resource);
    }
    updateAny(resource) {
        return this._getPermission(enums_1.Action.UPDATE, enums_1.Possession.ANY, resource);
    }
    update(resource) {
        return this.updateAny(resource);
    }
    deleteOwn(resource) {
        return this._getPermission(enums_1.Action.DELETE, enums_1.Possession.OWN, resource);
    }
    deleteAny(resource) {
        return this._getPermission(enums_1.Action.DELETE, enums_1.Possession.ANY, resource);
    }
    delete(resource) {
        return this.deleteAny(resource);
    }
    _getPermission(action, possession, resource) {
        this._.action = action;
        this._.possession = possession;
        if (resource)
            this._.resource = resource;
        return new permission_1.Permission(this._grants, this._);
    }
}
exports.Query = Query;
//# sourceMappingURL=Query.js.map