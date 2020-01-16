"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Notation = require("notation");
const core_1 = require("./core");
const enums_1 = require("./enums");
const RESERVED_KEYWORDS = ['*', '!', '$', '$extend'];
exports.RESERVED_KEYWORDS = RESERVED_KEYWORDS;
const ERR_LOCK = 'Cannot alter the underlying grants model. AccessControl instance is locked.';
exports.ERR_LOCK = ERR_LOCK;
const utils = {
    type(o) {
        return Object.prototype.toString.call(o).match(/\s(\w+)/i)[1].toLowerCase();
    },
    hasDefined(o, propName) {
        return o.hasOwnProperty(propName) && o[propName] !== undefined;
    },
    toStringArray(value) {
        if (Array.isArray(value))
            return value;
        if (typeof value === 'string')
            return value.trim().split(/\s*[;,]\s*/);
        return [];
    },
    isFilledStringArray(arr) {
        if (!arr || !Array.isArray(arr))
            return false;
        for (const s of arr) {
            if (typeof s !== 'string' || s.trim() === '')
                return false;
        }
        return true;
    },
    isEmptyArray(value) {
        return Array.isArray(value) && value.length === 0;
    },
    pushUniq(arr, item) {
        if (arr.indexOf(item) < 0)
            arr.push(item);
        return arr;
    },
    uniqConcat(arrA, arrB) {
        const arr = arrA.concat();
        arrB.forEach((b) => {
            utils.pushUniq(arr, b);
        });
        return arr;
    },
    subtractArray(arrA, arrB) {
        return arrA.concat().filter(a => arrB.indexOf(a) === -1);
    },
    deepFreeze(o) {
        if (utils.type(o) !== 'object')
            return;
        const props = Object.getOwnPropertyNames(o);
        props.forEach((key) => {
            const sub = o[key];
            if (Array.isArray(sub))
                Object.freeze(sub);
            if (utils.type(sub) === 'object') {
                utils.deepFreeze(sub);
            }
        });
        return Object.freeze(o);
    },
    each(array, callback, thisArg = null) {
        const length = array.length;
        let index = -1;
        while (++index < length) {
            if (callback.call(thisArg, array[index], index, array) === false)
                break;
        }
    },
    eachKey(object, callback, thisArg = null) {
        utils.each(Object.keys(object), callback, thisArg);
    },
    eachRole(grants, callback) {
        utils.eachKey(grants, (name) => callback(grants[name], name));
    },
    eachRoleResource(grants, callback) {
        let resources;
        let resourceDefinition;
        utils.eachKey(grants, (role) => {
            resources = grants[role];
            utils.eachKey(resources, (resource) => {
                resourceDefinition = role[resource];
                callback(role, resource, resourceDefinition);
            });
        });
    },
    isInfoFulfilled(info) {
        return utils.hasDefined(info, 'role')
            && utils.hasDefined(info, 'action')
            && utils.hasDefined(info, 'resource');
    },
    validName(name, throwOnInvalid = true) {
        if (typeof name !== 'string' || name.trim() === '') {
            if (!throwOnInvalid)
                return false;
            throw new core_1.AccessControlError('Invalid name, expected a valid string.');
        }
        if (RESERVED_KEYWORDS.indexOf(name) >= 0) {
            if (!throwOnInvalid)
                return false;
            throw new core_1.AccessControlError(`Cannot use reserved name: "${name}"`);
        }
        return true;
    },
    hasValidNames(list, throwOnInvalid = true) {
        let allValid = true;
        utils.each(utils.toStringArray(list), (name) => {
            if (!utils.validName(name, throwOnInvalid)) {
                allValid = false;
                return false;
            }
            return true;
        });
        return allValid;
    },
    validResourceObject(o) {
        if (utils.type(o) !== 'object') {
            throw new core_1.AccessControlError(`Invalid resource definition.`);
        }
        utils.eachKey(o, (action) => {
            const s = action.split(':');
            if (enums_1.actions.indexOf(s[0]) === -1) {
                throw new core_1.AccessControlError(`Invalid action: "${action}"`);
            }
            if (s[1] && enums_1.possessions.indexOf(s[1]) === -1) {
                throw new core_1.AccessControlError(`Invalid action possession: "${action}"`);
            }
            const perms = o[action];
            if (!utils.isEmptyArray(perms) && !utils.isFilledStringArray(perms)) {
                throw new core_1.AccessControlError(`Invalid resource attributes for action "${action}".`);
            }
        });
        return true;
    },
    validRoleObject(grants, roleName) {
        const role = grants[roleName];
        if (!role || utils.type(role) !== 'object') {
            throw new core_1.AccessControlError(`Invalid role definition.`);
        }
        utils.eachKey(role, (resourceName) => {
            if (!utils.validName(resourceName, false)) {
                if (resourceName === '$extend') {
                    const extRoles = role[resourceName];
                    if (!utils.isFilledStringArray(extRoles)) {
                        throw new core_1.AccessControlError(`Invalid extend value for role "${roleName}": ${JSON.stringify(extRoles)}`);
                    }
                    else {
                        utils.extendRole(grants, roleName, extRoles);
                    }
                }
                else {
                    throw new core_1.AccessControlError(`Cannot use reserved name "${resourceName}" for a resource.`);
                }
            }
            else {
                utils.validResourceObject(role[resourceName]);
            }
        });
        return true;
    },
    getInspectedGrants(o) {
        let grants = {};
        const strErr = 'Invalid grants object.';
        const type = utils.type(o);
        if (type === 'object') {
            utils.eachKey(o, (roleName) => {
                if (utils.validName(roleName)) {
                    return utils.validRoleObject(o, roleName);
                }
                return false;
            });
            grants = o;
        }
        else if (type === 'array') {
            o.forEach((item) => utils.commitToGrants(grants, item, true));
        }
        else {
            throw new core_1.AccessControlError(`${strErr} Expected an array or object.`);
        }
        return grants;
    },
    getResources(grants) {
        const resources = {};
        utils.eachRoleResource(grants, (_, resource, __) => {
            resources[resource] = null;
        });
        return Object.keys(resources);
    },
    normalizeActionPossession(info, asString = false) {
        if (typeof info.action !== 'string') {
            throw new core_1.AccessControlError(`Invalid action: ${JSON.stringify(info)}`);
        }
        const s = info.action.split(':');
        if (enums_1.actions.indexOf(s[0].trim().toLowerCase()) < 0) {
            throw new core_1.AccessControlError(`Invalid action: ${s[0]}`);
        }
        info.action = s[0].trim().toLowerCase();
        const poss = info.possession || s[1];
        if (poss) {
            if (enums_1.possessions.indexOf(poss.trim().toLowerCase()) < 0) {
                throw new core_1.AccessControlError(`Invalid action possession: ${poss}`);
            }
            else {
                info.possession = poss.trim().toLowerCase();
            }
        }
        else {
            info.possession = enums_1.Possession.ANY;
        }
        return asString
            ? `${info.action}:${info.possession}`
            : info;
    },
    normalizeQueryInfo(query) {
        if (utils.type(query) !== 'object') {
            throw new core_1.AccessControlError(`Invalid IQueryInfo: ${typeof query}`);
        }
        let newQuery = Object.assign({}, query);
        newQuery.role = utils.toStringArray(newQuery.role);
        if (!utils.isFilledStringArray(newQuery.role)) {
            throw new core_1.AccessControlError(`Invalid role(s): ${JSON.stringify(newQuery.role)}`);
        }
        if (typeof newQuery.resource !== 'string' || newQuery.resource.trim() === '') {
            throw new core_1.AccessControlError(`Invalid resource: "${newQuery.resource}"`);
        }
        newQuery.resource = newQuery.resource.trim();
        newQuery = utils.normalizeActionPossession(newQuery);
        return newQuery;
    },
    normalizeAccessInfo(access, all = false) {
        if (utils.type(access) !== 'object') {
            throw new core_1.AccessControlError(`Invalid IAccessInfo: ${typeof access}`);
        }
        let newAccess = Object.assign({}, access);
        newAccess.role = utils.toStringArray(newAccess.role);
        if (newAccess.role.length === 0 || !utils.isFilledStringArray(newAccess.role)) {
            throw new core_1.AccessControlError(`Invalid role(s): ${JSON.stringify(newAccess.role)}`);
        }
        newAccess.resource = utils.toStringArray(newAccess.resource);
        if (newAccess.resource.length === 0 || !utils.isFilledStringArray(newAccess.resource)) {
            throw new core_1.AccessControlError(`Invalid resource(s): ${JSON.stringify(newAccess.resource)}`);
        }
        if (newAccess.denied ||
            (Array.isArray(newAccess.attributes) && newAccess.attributes.length === 0)) {
            newAccess.attributes = [];
        }
        else {
            newAccess.attributes = !newAccess.attributes
                ? ['*']
                : utils.toStringArray(newAccess.attributes);
        }
        if (all) {
            newAccess = utils.normalizeActionPossession(newAccess);
        }
        return newAccess;
    },
    resetAttributes(access) {
        if (access.denied) {
            access.attributes = [];
            return access;
        }
        if (!access.attributes || utils.isEmptyArray(access.attributes)) {
            access.attributes = ['*'];
        }
        return access;
    },
    getRoleHierarchyOf(grants, roleName, rootRole) {
        const role = grants[roleName];
        if (!role)
            throw new core_1.AccessControlError(`Role not found: "${roleName}"`);
        let arr = [roleName];
        if (!Array.isArray(role.$extend) || role.$extend.length === 0)
            return arr;
        role.$extend.forEach((exRoleName) => {
            if (!grants[exRoleName]) {
                throw new core_1.AccessControlError(`Role not found: "${grants[exRoleName]}"`);
            }
            if (exRoleName === roleName) {
                throw new core_1.AccessControlError(`Cannot extend role "${roleName}" by itself.`);
            }
            if (rootRole && (rootRole === exRoleName)) {
                throw new core_1.AccessControlError(`Cross inheritance is not allowed. Role "${exRoleName}" already extends "${rootRole}".`);
            }
            const ext = utils.getRoleHierarchyOf(grants, exRoleName, rootRole || roleName);
            arr = utils.uniqConcat(arr, ext);
        });
        return arr;
    },
    getFlatRoles(grants, roles) {
        const arrRoles = utils.toStringArray(roles);
        if (arrRoles.length === 0) {
            throw new core_1.AccessControlError(`Invalid role(s): ${JSON.stringify(roles)}`);
        }
        let arr = utils.uniqConcat([], arrRoles);
        arrRoles.forEach((roleName) => {
            arr = utils.uniqConcat(arr, utils.getRoleHierarchyOf(grants, roleName));
        });
        return arr;
    },
    getNonExistentRoles(grants, roles) {
        const non = [];
        if (utils.isEmptyArray(roles))
            return non;
        for (const role of roles) {
            if (!grants.hasOwnProperty(role))
                non.push(role);
        }
        return non;
    },
    getCrossExtendingRole(grants, roleName, extenderRoles) {
        const extenders = utils.toStringArray(extenderRoles);
        let crossInherited = null;
        utils.each(extenders, (e) => {
            if (crossInherited || roleName === e) {
                return false;
            }
            const inheritedByExtender = utils.getRoleHierarchyOf(grants, e);
            utils.each(inheritedByExtender, (r) => {
                if (r === roleName) {
                    crossInherited = e;
                    return false;
                }
                return true;
            });
            return true;
        });
        return crossInherited;
    },
    extendRole(grants, roles, extenderRoles) {
        roles = utils.toStringArray(roles);
        if (roles.length === 0) {
            throw new core_1.AccessControlError(`Invalid role(s): ${JSON.stringify(roles)}`);
        }
        if (utils.isEmptyArray(extenderRoles))
            return;
        const arrExtRoles = utils.toStringArray(extenderRoles).concat();
        if (arrExtRoles.length === 0) {
            throw new core_1.AccessControlError(`Cannot inherit invalid role(s): ${JSON.stringify(extenderRoles)}`);
        }
        const nonExistentExtRoles = utils.getNonExistentRoles(grants, arrExtRoles);
        if (nonExistentExtRoles.length > 0) {
            throw new core_1.AccessControlError(`Cannot inherit non-existent role(s): "${nonExistentExtRoles.join(', ')}"`);
        }
        roles.forEach((roleName) => {
            if (!grants[roleName])
                throw new core_1.AccessControlError(`Role not found: "${roleName}"`);
            if (arrExtRoles.indexOf(roleName) >= 0) {
                throw new core_1.AccessControlError(`Cannot extend role "${roleName}" by itself.`);
            }
            const crossInherited = utils.getCrossExtendingRole(grants, roleName, arrExtRoles);
            if (crossInherited) {
                throw new core_1.AccessControlError(`Cross inheritance is not allowed. Role "${crossInherited}" already extends "${roleName}".`);
            }
            utils.validName(roleName);
            const r = grants[roleName];
            if (Array.isArray(r.$extend)) {
                r.$extend = utils.uniqConcat(r.$extend, arrExtRoles);
            }
            else {
                r.$extend = arrExtRoles;
            }
        });
    },
    preCreateRoles(grants, roles) {
        if (typeof roles === 'string') {
            roles = utils.toStringArray(roles);
        }
        if (!Array.isArray(roles) || roles.length === 0) {
            throw new core_1.AccessControlError(`Invalid role(s): ${JSON.stringify(roles)}`);
        }
        roles.forEach((role) => {
            if (utils.validName(role) && !grants.hasOwnProperty(role)) {
                grants[role] = {};
            }
        });
    },
    commitToGrants(grants, access, normalizeAll = false) {
        access = utils.normalizeAccessInfo(access, normalizeAll);
        access.role.forEach((role) => {
            if (utils.validName(role) && !grants.hasOwnProperty(role)) {
                grants[role] = {};
            }
            const grantItem = grants[role];
            const ap = `${access.action}:${access.possession}`;
            access.resource.forEach((res) => {
                if (utils.validName(res) && !grantItem.hasOwnProperty(res)) {
                    grantItem[res] = {};
                }
                grantItem[res][ap] = utils.toStringArray(access.attributes);
            });
        });
    },
    getUnionAttrsOfRoles(grants, query) {
        query = utils.normalizeQueryInfo(query);
        let role;
        let resource;
        const attrsList = [];
        const roles = utils.getFlatRoles(grants, query.role);
        roles.forEach((roleName, _) => {
            role = grants[roleName];
            resource = role[query.resource];
            if (resource) {
                attrsList.push((resource[`${query.action}:${query.possession}`]
                    || resource[`${query.action}:any`]
                    || []).concat());
            }
        });
        let attrs = [];
        const len = attrsList.length;
        if (len > 0) {
            attrs = attrsList[0];
            let i = 1;
            while (i < len) {
                attrs = Notation.Glob.union(attrs, attrsList[i]);
                i++;
            }
        }
        return attrs;
    },
    lockAC(ac) {
        const acCopy = ac;
        if (!acCopy._grants || Object.keys(acCopy._grants).length === 0) {
            throw new core_1.AccessControlError('Cannot lock empty or invalid grants model.');
        }
        let locked = ac.isLocked && Object.isFrozen(acCopy._grants);
        if (!locked)
            locked = Boolean(utils.deepFreeze(acCopy._grants));
        if (!locked) {
            throw new core_1.AccessControlError(`Could not lock grants: ${typeof acCopy._grants}`);
        }
        acCopy._isLocked = locked;
    },
    filter(object, attributes) {
        if (!Array.isArray(attributes) || attributes.length === 0) {
            return {};
        }
        const notation = new Notation(object);
        return notation.filter(attributes).value;
    },
    filterAll(arrOrObj, attributes) {
        if (!Array.isArray(arrOrObj)) {
            return utils.filter(arrOrObj, attributes);
        }
        return arrOrObj.map((o) => {
            return utils.filter(o, attributes);
        });
    },
};
exports.utils = utils;
//# sourceMappingURL=utils.js.map