"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Access = void 0;
const enums_1 = require("../enums");
const error_1 = require("../error");
const utils_1 = require("../utils");
class Access {
    constructor(ac, roleOrInfo, denied = false) {
        this._ = {};
        this._ac = ac;
        this._grants = ac.grants;
        this._.denied = denied;
        if (typeof roleOrInfo === 'string' || Array.isArray(roleOrInfo)) {
            this.role(roleOrInfo);
        }
        else if (utils_1.type(roleOrInfo) === 'object') {
            if (Object.keys(roleOrInfo).length === 0) {
                throw new error_1.AccessControlError('Invalid IAccessInfo: {}');
            }
            roleOrInfo.denied = denied;
            this._ = utils_1.resetAttributes(roleOrInfo);
            if (utils_1.isInfoFulfilled(this._))
                utils_1.commitToGrants(this._grants, this._, true);
        }
        else if (roleOrInfo !== undefined) {
            throw new error_1.AccessControlError('Invalid role(s), expected a valid string, string[] or IAccessInfo.');
        }
    }
    get denied() {
        return this._.denied;
    }
    role(value) {
        utils_1.preCreateRoles(this._grants, value);
        this._.role = value;
        return this;
    }
    resource(value) {
        utils_1.hasValidNames(value, true);
        this._.resource = value;
        return this;
    }
    attributes(value) {
        this._.attributes = value;
        return this;
    }
    extend(roles) {
        utils_1.extendRole(this._grants, this._.role, roles);
        return this;
    }
    grant(roleOrInfo) {
        return new Access(this._ac, roleOrInfo, false).attributes(['*']);
    }
    deny(roleOrInfo) {
        return new Access(this._ac, roleOrInfo, true).attributes([]);
    }
    createOwn(resource, attributes) {
        return this._prepareAndCommit(enums_1.Action.CREATE, enums_1.Possession.OWN, resource, attributes);
    }
    createAny(resource, attributes) {
        return this._prepareAndCommit(enums_1.Action.CREATE, enums_1.Possession.ANY, resource, attributes);
    }
    create(resource, attributes) {
        return this.createAny(resource, attributes);
    }
    readOwn(resource, attributes) {
        return this._prepareAndCommit(enums_1.Action.READ, enums_1.Possession.OWN, resource, attributes);
    }
    readAny(resource, attributes) {
        return this._prepareAndCommit(enums_1.Action.READ, enums_1.Possession.ANY, resource, attributes);
    }
    read(resource, attributes) {
        return this.readAny(resource, attributes);
    }
    updateOwn(resource, attributes) {
        return this._prepareAndCommit(enums_1.Action.UPDATE, enums_1.Possession.OWN, resource, attributes);
    }
    updateAny(resource, attributes) {
        return this._prepareAndCommit(enums_1.Action.UPDATE, enums_1.Possession.ANY, resource, attributes);
    }
    update(resource, attributes) {
        return this.updateAny(resource, attributes);
    }
    deleteOwn(resource, attributes) {
        return this._prepareAndCommit(enums_1.Action.DELETE, enums_1.Possession.OWN, resource, attributes);
    }
    deleteAny(resource, attributes) {
        return this._prepareAndCommit(enums_1.Action.DELETE, enums_1.Possession.ANY, resource, attributes);
    }
    delete(resource, attributes) {
        return this.deleteAny(resource, attributes);
    }
    _prepareAndCommit(action, possession, resource, attributes) {
        this._.action = action;
        this._.possession = possession;
        if (resource)
            this._.resource = resource;
        if (this._.denied) {
            this._.attributes = [];
        }
        else {
            this._.attributes = attributes ? utils_1.toStringArray(attributes) : ['*'];
        }
        utils_1.commitToGrants(this._grants, this._, false);
        this._.attributes = undefined;
        return this;
    }
}
exports.Access = Access;
//# sourceMappingURL=Access.js.map