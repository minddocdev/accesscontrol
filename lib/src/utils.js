"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const enums_1 = require("./enums");
const error_1 = require("./error");
exports.RESERVED_KEYWORDS = ['*', '!', '$', '$extend'];
function type(o) {
    return Object.prototype.toString
        .call(o)
        .match(/\s(\w+)/i)[1]
        .toLowerCase();
}
exports.type = type;
function hasDefined(o, propName) {
    return o.hasOwnProperty(propName) && o[propName] !== undefined;
}
exports.hasDefined = hasDefined;
function toStringArray(value) {
    if (Array.isArray(value))
        return value;
    if (typeof value === 'string')
        return value.trim().split(/\s*[;,]\s*/);
    return [];
}
exports.toStringArray = toStringArray;
function isFilledStringArray(arr) {
    if (!arr || !Array.isArray(arr))
        return false;
    for (const s of arr) {
        if (typeof s !== 'string' || s.trim() === '')
            return false;
    }
    return true;
}
exports.isFilledStringArray = isFilledStringArray;
function isEmptyArray(value) {
    return Array.isArray(value) && value.length === 0;
}
exports.isEmptyArray = isEmptyArray;
function uniqConcat(arrA, arrB) {
    const arr = arrA.concat();
    arrB.forEach((b) => {
        pushUniq(arr, b);
    });
    return arr;
}
exports.uniqConcat = uniqConcat;
function pushUniq(arr, item) {
    if (arr.indexOf(item) < 0)
        arr.push(item);
    return arr;
}
exports.pushUniq = pushUniq;
function each(array, callback, thisArg = null) {
    const length = array.length;
    let index = -1;
    while (++index < length) {
        if (callback.call(thisArg, array[index], index, array) === false)
            break;
    }
}
exports.each = each;
function eachKey(object, callback, thisArg = null) {
    each(Object.keys(object), callback, thisArg);
}
exports.eachKey = eachKey;
function eachRole(grants, callback) {
    eachKey(grants, (name) => callback(grants[name], name));
}
exports.eachRole = eachRole;
function eachRoleResource(grants, callback) {
    let resources;
    let resourceDefinition;
    eachKey(grants, (role) => {
        resources = grants[role];
        eachKey(resources, (resource) => {
            resourceDefinition = role[resource];
            callback(role, resource, resourceDefinition);
        });
    });
}
exports.eachRoleResource = eachRoleResource;
function isInfoFulfilled(info) {
    return hasDefined(info, 'role') && hasDefined(info, 'action') && hasDefined(info, 'resource');
}
exports.isInfoFulfilled = isInfoFulfilled;
function normalizeActionPossession(info, asString = false) {
    if (typeof info.action !== 'string') {
        throw new error_1.AccessControlError(`Invalid action: ${JSON.stringify(info)}`);
    }
    const s = info.action.split(':');
    if (enums_1.actions.indexOf(s[0].trim().toLowerCase()) < 0) {
        throw new error_1.AccessControlError(`Invalid action: ${s[0]}`);
    }
    info.action = s[0].trim().toLowerCase();
    const poss = info.possession || s[1];
    if (poss) {
        if (enums_1.possessions.indexOf(poss.trim().toLowerCase()) < 0) {
            throw new error_1.AccessControlError(`Invalid action possession: ${poss}`);
        }
        else {
            info.possession = poss.trim().toLowerCase();
        }
    }
    else {
        info.possession = enums_1.Possession.ANY;
    }
    return asString ? `${info.action}:${info.possession}` : info;
}
exports.normalizeActionPossession = normalizeActionPossession;
function normalizeAccessInfo(access, all = false) {
    if (type(access) !== 'object') {
        throw new error_1.AccessControlError(`Invalid IAccessInfo: ${typeof access}`);
    }
    let newAccess = Object.assign({}, access);
    newAccess.role = toStringArray(newAccess.role);
    if (newAccess.role.length === 0 || !isFilledStringArray(newAccess.role)) {
        throw new error_1.AccessControlError(`Invalid role(s): ${JSON.stringify(newAccess.role)}`);
    }
    newAccess.resource = toStringArray(newAccess.resource);
    if (newAccess.resource.length === 0 || !isFilledStringArray(newAccess.resource)) {
        throw new error_1.AccessControlError(`Invalid resource(s): ${JSON.stringify(newAccess.resource)}`);
    }
    if (newAccess.denied ||
        (Array.isArray(newAccess.attributes) && newAccess.attributes.length === 0)) {
        newAccess.attributes = [];
    }
    else {
        newAccess.attributes = !newAccess.attributes ? ['*'] : toStringArray(newAccess.attributes);
    }
    if (all) {
        newAccess = normalizeActionPossession(newAccess);
    }
    return newAccess;
}
exports.normalizeAccessInfo = normalizeAccessInfo;
function normalizeQueryInfo(query) {
    if (type(query) !== 'object') {
        throw new error_1.AccessControlError(`Invalid IQueryInfo: ${typeof query}`);
    }
    let newQuery = Object.assign({}, query);
    newQuery.role = toStringArray(newQuery.role);
    if (!isFilledStringArray(newQuery.role)) {
        throw new error_1.AccessControlError(`Invalid role(s): ${JSON.stringify(newQuery.role)}`);
    }
    if (typeof newQuery.resource !== 'string' || newQuery.resource.trim() === '') {
        throw new error_1.AccessControlError(`Invalid resource: "${newQuery.resource}"`);
    }
    newQuery.resource = newQuery.resource.trim();
    newQuery = normalizeActionPossession(newQuery);
    return newQuery;
}
exports.normalizeQueryInfo = normalizeQueryInfo;
function getResources(grants) {
    const resources = {};
    eachRoleResource(grants, (_, resource, __) => {
        resources[resource] = null;
    });
    return Object.keys(resources);
}
exports.getResources = getResources;
function resetAttributes(access) {
    if (access.denied) {
        access.attributes = [];
        return access;
    }
    if (!access.attributes || isEmptyArray(access.attributes)) {
        access.attributes = ['*'];
    }
    return access;
}
exports.resetAttributes = resetAttributes;
function getFlatRoles(grants, roles) {
    const arrRoles = toStringArray(roles);
    if (arrRoles.length === 0) {
        throw new error_1.AccessControlError(`Invalid role(s): ${JSON.stringify(roles)}`);
    }
    let arr = uniqConcat([], arrRoles);
    arrRoles.forEach((roleName) => {
        arr = uniqConcat(arr, getRoleHierarchyOf(grants, roleName));
    });
    return arr;
}
exports.getFlatRoles = getFlatRoles;
function getNonExistentRoles(grants, roles) {
    const non = [];
    if (isEmptyArray(roles))
        return non;
    for (const role of roles) {
        if (!grants.hasOwnProperty(role))
            non.push(role);
    }
    return non;
}
exports.getNonExistentRoles = getNonExistentRoles;
function getCrossExtendingRole(grants, roleName, extenderRoles) {
    const extenders = toStringArray(extenderRoles);
    let crossInherited = null;
    each(extenders, (e) => {
        if (crossInherited || roleName === e) {
            return false;
        }
        const inheritedByExtender = getRoleHierarchyOf(grants, e);
        each(inheritedByExtender, (r) => {
            if (r === roleName) {
                crossInherited = e;
                return false;
            }
            return true;
        });
        return true;
    });
    return crossInherited;
}
exports.getCrossExtendingRole = getCrossExtendingRole;
function extendRole(grants, roles, extenderRoles) {
    roles = toStringArray(roles);
    if (roles.length === 0) {
        throw new error_1.AccessControlError(`Invalid role(s): ${JSON.stringify(roles)}`);
    }
    if (isEmptyArray(extenderRoles))
        return;
    const arrExtRoles = toStringArray(extenderRoles).concat();
    if (arrExtRoles.length === 0) {
        throw new error_1.AccessControlError(`Cannot inherit invalid role(s): ${JSON.stringify(extenderRoles)}`);
    }
    const nonExistentExtRoles = getNonExistentRoles(grants, arrExtRoles);
    if (nonExistentExtRoles.length > 0) {
        throw new error_1.AccessControlError(`Cannot inherit non-existent role(s): "${nonExistentExtRoles.join(', ')}"`);
    }
    roles.forEach((roleName) => {
        if (!grants[roleName])
            throw new error_1.AccessControlError(`Role not found: "${roleName}"`);
        if (arrExtRoles.indexOf(roleName) >= 0) {
            throw new error_1.AccessControlError(`Cannot extend role "${roleName}" by itself.`);
        }
        const crossInherited = getCrossExtendingRole(grants, roleName, arrExtRoles);
        if (crossInherited) {
            throw new error_1.AccessControlError(`Cross inheritance is not allowed. Role "${crossInherited}" already extends "${roleName}".`);
        }
        validName(roleName);
        const r = grants[roleName];
        if (Array.isArray(r.$extend)) {
            r.$extend = uniqConcat(r.$extend, arrExtRoles);
        }
        else {
            r.$extend = arrExtRoles;
        }
    });
}
exports.extendRole = extendRole;
function preCreateRoles(grants, roles) {
    if (typeof roles === 'string') {
        roles = toStringArray(roles);
    }
    if (!Array.isArray(roles) || roles.length === 0) {
        throw new error_1.AccessControlError(`Invalid role(s): ${JSON.stringify(roles)}`);
    }
    roles.forEach((role) => {
        if (validName(role) && !grants.hasOwnProperty(role)) {
            grants[role] = {};
        }
    });
}
exports.preCreateRoles = preCreateRoles;
function getRoleHierarchyOf(grants, roleName, rootRole) {
    const role = grants[roleName];
    if (!role)
        throw new error_1.AccessControlError(`Role not found: "${roleName}"`);
    let arr = [roleName];
    if (!Array.isArray(role.$extend) || role.$extend.length === 0)
        return arr;
    role.$extend.forEach((exRoleName) => {
        if (!grants[exRoleName]) {
            throw new error_1.AccessControlError(`Role not found: "${grants[exRoleName]}"`);
        }
        if (exRoleName === roleName) {
            throw new error_1.AccessControlError(`Cannot extend role "${roleName}" by itself.`);
        }
        if (rootRole && rootRole === exRoleName) {
            throw new error_1.AccessControlError(`Cross inheritance is not allowed. Role "${exRoleName}" already extends "${rootRole}".`);
        }
        const ext = getRoleHierarchyOf(grants, exRoleName, rootRole || roleName);
        arr = uniqConcat(arr, ext);
    });
    return arr;
}
exports.getRoleHierarchyOf = getRoleHierarchyOf;
function validResourceObject(o) {
    if (type(o) !== 'object') {
        throw new error_1.AccessControlError(`Invalid resource definition.`);
    }
    eachKey(o, (action) => {
        const s = action.split(':');
        if (enums_1.actions.indexOf(s[0]) === -1) {
            throw new error_1.AccessControlError(`Invalid action: "${action}"`);
        }
        if (s[1] && enums_1.possessions.indexOf(s[1]) === -1) {
            throw new error_1.AccessControlError(`Invalid action possession: "${action}"`);
        }
        const perms = o[action];
        if (!isEmptyArray(perms) && !isFilledStringArray(perms)) {
            throw new error_1.AccessControlError(`Invalid resource attributes for action "${action}".`);
        }
    });
    return true;
}
exports.validResourceObject = validResourceObject;
function validRoleObject(grants, roleName) {
    const role = grants[roleName];
    if (!role || type(role) !== 'object') {
        throw new error_1.AccessControlError(`Invalid role definition.`);
    }
    eachKey(role, (resourceName) => {
        if (!validName(resourceName, false)) {
            if (resourceName === '$extend') {
                const extRoles = role[resourceName];
                if (!isFilledStringArray(extRoles)) {
                    throw new error_1.AccessControlError(`Invalid extend value for role "${roleName}": ${JSON.stringify(extRoles)}`);
                }
                else {
                    extendRole(grants, roleName, extRoles);
                }
            }
            else {
                throw new error_1.AccessControlError(`Cannot use reserved name "${resourceName}" for a resource.`);
            }
        }
        else {
            validResourceObject(role[resourceName]);
        }
    });
    return true;
}
exports.validRoleObject = validRoleObject;
function validName(name, throwOnInvalid = true) {
    if (typeof name !== 'string' || name.trim() === '') {
        if (!throwOnInvalid)
            return false;
        throw new error_1.AccessControlError('Invalid name, expected a valid string.');
    }
    if (exports.RESERVED_KEYWORDS.indexOf(name) >= 0) {
        if (!throwOnInvalid)
            return false;
        throw new error_1.AccessControlError(`Cannot use reserved name: "${name}"`);
    }
    return true;
}
exports.validName = validName;
function hasValidNames(list, throwOnInvalid = true) {
    let allValid = true;
    each(toStringArray(list), (name) => {
        if (!validName(name, throwOnInvalid)) {
            allValid = false;
            return false;
        }
        return true;
    });
    return allValid;
}
exports.hasValidNames = hasValidNames;
function getInspectedGrants(grantsObject) {
    let grants = {};
    if (type(grantsObject) === 'object') {
        eachKey(grantsObject, (roleName) => {
            if (validName(roleName)) {
                return validRoleObject(grantsObject, roleName);
            }
            return false;
        });
        grants = grantsObject;
    }
    else if (type(grantsObject) === 'array') {
        grantsObject.forEach((item) => commitToGrants(grants, item, true));
    }
    else {
        throw new error_1.AccessControlError('Invalid grants object. Expected an array or object.');
    }
    return grants;
}
exports.getInspectedGrants = getInspectedGrants;
function commitToGrants(grants, access, normalizeAll = false) {
    const newAccess = normalizeAccessInfo(access, normalizeAll);
    newAccess.role.forEach((role) => {
        if (validName(role) && !grants.hasOwnProperty(role)) {
            grants[role] = {};
        }
        const grantItem = grants[role];
        const ap = `${newAccess.action}:${newAccess.possession}`;
        newAccess.resource.forEach((res) => {
            if (validName(res) && !grantItem.hasOwnProperty(res)) {
                grantItem[res] = {};
            }
            grantItem[res][ap] = toStringArray(newAccess.attributes);
        });
    });
}
exports.commitToGrants = commitToGrants;
function getUnionAttrsOfRoles(grants, query) {
    const normalizedQuery = normalizeQueryInfo(query);
    let role;
    let resource;
    const attrsList = [];
    const roles = getFlatRoles(grants, normalizedQuery.role);
    roles.forEach((roleName, _) => {
        role = grants[roleName];
        resource = role[normalizedQuery.resource];
        if (resource) {
            attrsList.push((resource[`${normalizedQuery.action}:${normalizedQuery.possession}`] ||
                resource[`${normalizedQuery.action}:any`] ||
                []).concat());
        }
    });
    let jointArray = [];
    attrsList.forEach((array) => {
        jointArray = [...jointArray, ...array];
    });
    const union = Array.from(new Set([...jointArray]));
    const hasWildcard = union.includes('*');
    for (let i = 0; i < union.length; i++) {
        if ((hasWildcard || union[i].includes('!')) &&
            !union[i].includes('!') &&
            !union[i].includes('*')) {
            union.splice(i, 1);
        }
    }
    return union.includes('*') ? ['*'] : union.sort().reverse();
}
exports.getUnionAttrsOfRoles = getUnionAttrsOfRoles;
//# sourceMappingURL=utils.js.map