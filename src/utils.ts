import { actions, Possession, possessions } from './enums';
import { AccessControlError } from './error';
import { IAccessInfo, IQueryInfo } from './interfaces';

export const RESERVED_KEYWORDS = ['*', '!', '$', '$extend'];

/**
 * Gets the type of the given object.
 *
 * @param {Any} o
 * @returns {String}
 */
export function type(o: any): string {
  return Object.prototype.toString
    .call(o!)
    .match(/\s(\w+)/i)![1]
    .toLowerCase();
}

/**
 * Specifies whether the property/key is defined on the given object.
 *
 * @param {Object} o
 * @param {string} propName
 * @returns {Boolean}
 */
export function hasDefined(o: any, propName: string): boolean {
  return o.hasOwnProperty(propName) && o[propName] !== undefined;
}

/**
 * Converts the given (string) value into an array of string. Note that
 * this does not throw if the value is not a string or array. It will
 * silently return `[]` (empty array). So where ever it's used, the host
 * function should consider throwing.
 *
 * @param {Any} value
 * @returns {string[]}
 */
export function toStringArray(value: any): string[] {
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') return value.trim().split(/\s*[;,]\s*/);
  return [];
}

/**
 * Checks whether the given array consists of non-empty string items.
 * (Array can be empty but no item should be an empty string.)
 *
 * @param {Array} arr - Array to be checked.
 * @returns {Boolean}
 */
export function isFilledStringArray(arr: any[]): boolean {
  if (!arr || !Array.isArray(arr)) return false;
  for (const s of arr) {
    if (typeof s !== 'string' || s.trim() === '') return false;
  }
  return true;
}

/**
 * Checks whether the given value is an empty array.
 *
 * @param {Any} value - Value to be checked.
 * @returns {Boolean}
 */
export function isEmptyArray(value: any): boolean {
  return Array.isArray(value) && value.length === 0;
}

/**
 * Concatenates the given two arrays and ensures all items are unique.
 *
 * @param {Array} arrA
 * @param {Array} arrB
 * @returns {Array} - Concatenated array.
 */
export function uniqConcat(arrA: string[], arrB: string[]): string[] {
  const arr: string[] = arrA.concat();
  arrB.forEach((b: string) => {
    pushUniq(arr, b);
  });
  return arr;
}

/**
 * Ensures that the pushed item is unique in the target array.
 *
 * @param {Array} arr - Target array.
 * @param {Any} item - Item to be pushed to array.
 * @returns {Array}
 */
export function pushUniq(arr: string[], item: string): string[] {
  if (arr.indexOf(item) < 0) arr.push(item);
  return arr;
}

/**
 * Similar to JS .forEach, except this allows for breaking out early,
 * (before all iterations are executed) by returning `false`.
 *
 * @param array
 * @param callback
 * @param thisArg
 */
export function each(array: any[], callback: any, thisArg: any = null as any) {
  const length = array.length;
  let index = -1;
  // tslint:disable no-increment-decrement
  while (++index < length) {
    if (callback.call(thisArg, array[index], index, array) === false) break;
  }
}

/**
 * Iterates through the keys of the given object. Breaking out early is
 * possible by returning `false`.
 *
 * @param object
 * @param callback
 * @param thisArg
 */
export function eachKey(object: any, callback: any, thisArg: any = null as any) {
  each(Object.keys(object), callback, thisArg);
}

export function eachRole(grants: any, callback: (role: any, roleName: string) => void) {
  eachKey(grants, (name: string) => callback(grants[name], name));
}

export function eachRoleResource(
  grants: any,
  callback: (role: string, resource: string, resourceDefinition: any) => void,
) {
  let resources;
  let resourceDefinition;
  eachKey(grants, (role: string) => {
    resources = grants[role];
    eachKey(resources, (resource: string) => {
      resourceDefinition = role[resource as any];
      callback(role, resource, resourceDefinition);
    });
  });
}

/**
 * Checks whether the given access info can be committed to grants model.
 *
 * @param {IAccessInfo|IQueryInfo} info
 * @returns {Boolean}
 */
export function isInfoFulfilled(info: IAccessInfo | IQueryInfo): boolean {
  return hasDefined(info, 'role') && hasDefined(info, 'action') && hasDefined(info, 'resource');
}

/**
 * Normalizes the actions and possessions in the given `IQueryInfo` or
 * `IAccessInfo`.
 *
 * @param {IQueryInfo|IAccessInfo} info
 * @param {boolean} [asString=false]
 * @return {IQueryInfo|IAccessInfo|string}
 * @throws {AccessControlError} - If invalid action/possession found.
 */
export function normalizeActionPossession(
  info: IQueryInfo | IAccessInfo,
  asString: boolean = false,
): IQueryInfo | IAccessInfo | string {
  // validate and normalize action
  if (typeof info.action !== 'string') {
    // throw new AccessControlError(`Invalid action: ${info.action}`);
    throw new AccessControlError(`Invalid action: ${JSON.stringify(info)}`);
  }

  const s: string[] = info.action.split(':');
  if (actions.indexOf(s[0].trim().toLowerCase()) < 0) {
    throw new AccessControlError(`Invalid action: ${s[0]}`);
  }
  info.action = s[0].trim().toLowerCase();

  // validate and normalize possession
  const poss: string = info.possession || s[1];
  if (poss) {
    if (possessions.indexOf(poss.trim().toLowerCase()) < 0) {
      throw new AccessControlError(`Invalid action possession: ${poss}`);
    } else {
      info.possession = poss.trim().toLowerCase();
    }
  } else {
    // if no possession is set, we'll default to "any".
    info.possession = Possession.ANY;
  }

  return asString ? `${info.action}:${info.possession}` : info;
}

/**
 * Normalizes the roles and resources in the given `IAccessInfo`.
 *
 * @param {IAccessInfo} info
 * @param {boolean} [all=false] - Whether to validate all properties such
 * as `action` and `possession`.
 * @return {IQueryInfo}
 * @throws {AccessControlError} - If invalid role/resource found.
 */
export function normalizeAccessInfo(access: IAccessInfo, all: boolean = false): IAccessInfo {
  if (type(access) !== 'object') {
    throw new AccessControlError(`Invalid IAccessInfo: ${typeof access}`);
  }
  // clone the object
  let newAccess = Object.assign({}, access);
  // validate and normalize role(s)
  newAccess.role = toStringArray(newAccess.role);
  if (newAccess.role.length === 0 || !isFilledStringArray(newAccess.role)) {
    throw new AccessControlError(`Invalid role(s): ${JSON.stringify(newAccess.role)}`);
  }

  // validate and normalize resource
  newAccess.resource = toStringArray(newAccess.resource);
  if (newAccess.resource.length === 0 || !isFilledStringArray(newAccess.resource)) {
    throw new AccessControlError(`Invalid resource(s): ${JSON.stringify(newAccess.resource)}`);
  }

  // normalize attributes
  if (
    newAccess.denied ||
    (Array.isArray(newAccess.attributes) && newAccess.attributes.length === 0)
  ) {
    newAccess.attributes = [];
  } else {
    // if omitted and not denied, all attributes are allowed
    newAccess.attributes = !newAccess.attributes ? ['*'] : toStringArray(newAccess.attributes);
  }

  // this part is not necessary if this is invoked from a committer method
  // such as `createAny()`. So we'll check if we need to validate all
  // properties such as `action` and `possession`.
  if (all) {
    newAccess = normalizeActionPossession(newAccess) as IAccessInfo;
  }

  return newAccess;
}

/**
 * Normalizes the roles and resources in the given `IQueryInfo`.
 *
 * @param {IQueryInfo} info
 * @return {IQueryInfo}
 * @throws {AccessControlError} - If invalid role/resource found.
 */
export function normalizeQueryInfo(query: IQueryInfo): IQueryInfo {
  if (type(query) !== 'object') {
    throw new AccessControlError(`Invalid IQueryInfo: ${typeof query}`);
  }
  // clone the object
  let newQuery = Object.assign({}, query);
  // validate and normalize role(s)
  newQuery.role = toStringArray(newQuery.role);
  if (!isFilledStringArray(newQuery.role)) {
    throw new AccessControlError(`Invalid role(s): ${JSON.stringify(newQuery.role)}`);
  }

  // validate resource
  if (typeof newQuery.resource !== 'string' || newQuery.resource.trim() === '') {
    throw new AccessControlError(`Invalid resource: "${newQuery.resource}"`);
  }
  newQuery.resource = newQuery.resource.trim();
  newQuery = normalizeActionPossession(newQuery) as IQueryInfo;
  return newQuery;
}

/**
 * Gets all the unique resources that are granted access for at
 * least one role.
 *
 * @returns {string[]}
 */
export function getResources(grants: any): string[] {
  // using an object for unique list
  const resources: any = {};
  eachRoleResource(grants, (_: string, resource: string, __: any) => {
    resources[resource] = null;
  });
  return Object.keys(resources);
}

/**
 * Used to re-set (prepare) the `attributes` of an `IAccessInfo` object
 * when it's first initialized with e.g. `.grant()` or `.deny()` chain
 * methods.
 *
 * @param {IAccessInfo} access
 * @returns {IAccessInfo}
 */
export function resetAttributes(access: IAccessInfo): IAccessInfo {
  if (access.denied) {
    access.attributes = [];
    return access;
  }
  if (!access.attributes || isEmptyArray(access.attributes)) {
    access.attributes = ['*'];
  }
  return access;
}

/**
 * Gets roles and extended roles in a flat array.
 */
export function getFlatRoles(grants: any, roles: string | string[]): string[] {
  const arrRoles: string[] = toStringArray(roles);
  if (arrRoles.length === 0) {
    throw new AccessControlError(`Invalid role(s): ${JSON.stringify(roles)}`);
  }
  let arr: string[] = uniqConcat([], arrRoles); // roles.concat();
  arrRoles.forEach((roleName: string) => {
    arr = uniqConcat(arr, getRoleHierarchyOf(grants, roleName));
  });
  // console.log(`flat roles for ${roles}`, arr);
  return arr;
}

/**
 * Checks the given grants model and gets an array of non-existent roles
 * from the given roles.
 *
 * @param {Any} grants - Grants model to be checked.
 * @param {string[]} roles - Roles to be checked.
 * @returns {string[]} - Array of non-existent roles. Empty array if
 * all exist.
 */
export function getNonExistentRoles(grants: any, roles: string[]) {
  const non: string[] = [];
  if (isEmptyArray(roles)) return non;
  for (const role of roles) {
    if (!grants.hasOwnProperty(role)) non.push(role);
  }
  return non;
}

/**
 * Checks whether the given extender role(s) is already (cross) inherited
 * by the given role and returns the first cross-inherited role. Otherwise,
 * returns `false`.
 *
 * Note that cross-inheritance is not allowed.
 *
 * @param {Any} grants - Grants model to be checked.
 * @param {string} roles - Target role to be checked.
 * @param {string|string[]} extenderRoles - Extender role(s) to be checked.
 * @returns {string|null} - Returns the first cross extending role. `null`
 * if none.
 */
export function getCrossExtendingRole(
  grants: any,
  roleName: string,
  extenderRoles: string | string[],
): string {
  const extenders: string[] = toStringArray(extenderRoles);
  let crossInherited: any = null;
  each(extenders, (e: string) => {
    if (crossInherited || roleName === e) {
      return false; // break out of loop
    }
    const inheritedByExtender = getRoleHierarchyOf(grants, e);
    each(inheritedByExtender, (r: string) => {
      if (r === roleName) {
        // get/report the parent role
        crossInherited = e;
        return false; // break out of loop
      }
      // suppress tslint warning
      return true; // continue
    });
    // suppress tslint warning
    return true; // continue
  });
  return crossInherited;
}

/**
 * Extends the given role(s) with privileges of one or more other roles.
 *
 * @param {Any} grants
 * @param {string|string[]} roles Role(s) to be extended. Single role
 *        as a `String` or multiple roles as an `Array`. Note that if a
 *        role does not exist, it will be automatically created.
 * @param {string|string[]} extenderRoles Role(s) to inherit from.
 *        Single role as a `String` or multiple roles as an `Array`. Note
 *        that if a extender role does not exist, it will throw.
 * @throws {Error} If a role is extended by itself, a non-existent role or
 *         a cross-inherited role.
 */
export function extendRole(
  grants: any,
  roles: string | string[],
  extenderRoles: string | string[],
) {
  // roles cannot be omitted or an empty array
  // tslint:disable no-parameter-reassignment
  roles = toStringArray(roles);
  // tslint:enable no-parameter-reassignment
  if (roles.length === 0) {
    throw new AccessControlError(`Invalid role(s): ${JSON.stringify(roles)}`);
  }

  // extenderRoles cannot be omitted or but can be an empty array
  if (isEmptyArray(extenderRoles)) return;

  const arrExtRoles: string[] = toStringArray(extenderRoles).concat();
  if (arrExtRoles.length === 0) {
    throw new AccessControlError(
      `Cannot inherit invalid role(s): ${JSON.stringify(extenderRoles)}`,
    );
  }

  const nonExistentExtRoles: string[] = getNonExistentRoles(grants, arrExtRoles);
  if (nonExistentExtRoles.length > 0) {
    throw new AccessControlError(
      `Cannot inherit non-existent role(s): "${nonExistentExtRoles.join(', ')}"`,
    );
  }

  roles.forEach((roleName: string) => {
    if (!grants[roleName]) throw new AccessControlError(`Role not found: "${roleName}"`);

    if (arrExtRoles.indexOf(roleName) >= 0) {
      throw new AccessControlError(`Cannot extend role "${roleName}" by itself.`);
    }

    // getCrossExtendingRole() returns false or the first cross-inherited role, if found.
    const crossInherited: string = getCrossExtendingRole(grants, roleName, arrExtRoles);
    if (crossInherited) {
      throw new AccessControlError(
        `Cross inheritance is not allowed. Role "${crossInherited}" already extends "${roleName}".`,
      );
    }

    validName(roleName); // throws if false
    const r = grants[roleName];
    if (Array.isArray(r.$extend)) {
      r.$extend = uniqConcat(r.$extend, arrExtRoles);
    } else {
      r.$extend = arrExtRoles;
    }
  });
}

/**
 * `commitToGrants()` method already creates the roles but it's
 * executed when the chain is terminated with either `.extend()` or an
 * action method (e.g. `.createOwn()`). In case the chain is not
 * terminated, we'll still (pre)create the role(s) with an empty object.
 *
 * @param {Any} grants
 * @param {string|string[]} roles
 */
export function preCreateRoles(grants: any, roles: string | string[]) {
  if (typeof roles === 'string') {
    // tslint:disable no-parameter-reassignment
    roles = toStringArray(roles);
    // tslint:enable no-parameter-reassignment
  }
  if (!Array.isArray(roles) || roles.length === 0) {
    throw new AccessControlError(`Invalid role(s): ${JSON.stringify(roles)}`);
  }
  (roles as string[]).forEach((role: string) => {
    if (validName(role) && !grants.hasOwnProperty(role)) {
      grants[role] = {};
    }
  });
}

/**
 * Gets a flat, ordered list of inherited roles for the given role.
 *
 * @param {Object} grants - Main grants object to be processed.
 * @param {string} roleName - Role name to be inspected.
 * @returns {string[]}
 */
export function getRoleHierarchyOf(grants: any, roleName: string, rootRole?: string): string[] {
  // `rootRole` is for memory storage.
  const role: any = grants[roleName];
  if (!role) throw new AccessControlError(`Role not found: "${roleName}"`);

  let arr: string[] = [roleName];
  if (!Array.isArray(role.$extend) || role.$extend.length === 0) return arr;

  role.$extend.forEach((exRoleName: string) => {
    if (!grants[exRoleName]) {
      throw new AccessControlError(`Role not found: "${grants[exRoleName]}"`);
    }
    if (exRoleName === roleName) {
      throw new AccessControlError(`Cannot extend role "${roleName}" by itself.`);
    }
    // throw if cross-inheritance and also avoid memory leak with maximum call stack error
    if (rootRole && rootRole === exRoleName) {
      throw new AccessControlError(
        `Cross inheritance is not allowed. Role "${exRoleName}" already extends "${rootRole}".`,
      );
    }
    const ext: string[] = getRoleHierarchyOf(grants, exRoleName, rootRole || roleName);
    arr = uniqConcat(arr, ext);
  });
  return arr;
}

/**
 * Checks whether the given object is a valid resource definition object.
 *
 * @param {Object} o - Resource definition to be checked.
 * @returns {Boolean}
 * @throws {AccessControlError} - If `throwOnInvalid` is enabled and object
 * is invalid.
 */
export function validResourceObject(o: any): boolean {
  if (type(o) !== 'object') {
    throw new AccessControlError(`Invalid resource definition.`);
  }

  eachKey(o, (action: any) => {
    const s: string[] = action.split(':');
    if (actions.indexOf(s[0]) === -1) {
      throw new AccessControlError(`Invalid action: "${action}"`);
    }
    if (s[1] && possessions.indexOf(s[1]) === -1) {
      throw new AccessControlError(`Invalid action possession: "${action}"`);
    }
    const perms = o[action];
    if (!isEmptyArray(perms) && !isFilledStringArray(perms)) {
      throw new AccessControlError(`Invalid resource attributes for action "${action}".`);
    }
  });
  return true;
}

/**
 * Checks whether the given object is a valid role definition object.
 *
 * @param {Object} grants - Original grants object being inspected.
 * @param {string} roleName - Name of the role.
 * @returns {Boolean}
 * @throws {AccessControlError} - If `throwOnInvalid` is enabled and object
 * is invalid.
 */
export function validRoleObject(grants: any, roleName: string): boolean {
  const role = grants[roleName];
  if (!role || type(role) !== 'object') {
    throw new AccessControlError(`Invalid role definition.`);
  }

  eachKey(role, (resourceName: string) => {
    if (!validName(resourceName, false)) {
      if (resourceName === '$extend') {
        const extRoles: string[] = role[resourceName]; // semantics
        if (!isFilledStringArray(extRoles)) {
          throw new AccessControlError(
            `Invalid extend value for role "${roleName}": ${JSON.stringify(extRoles)}`,
          );
        } else {
          // attempt to actually extend the roles. this will throw
          // on failure.
          extendRole(grants, roleName, extRoles);
        }
      } else {
        throw new AccessControlError(`Cannot use reserved name "${resourceName}" for a resource.`);
      }
    } else {
      validResourceObject(role[resourceName]); // throws on failure
    }
  });
  return true;
}

/**
 * Checks whether the given name can be used and is not a reserved keyword.
 *
 * @param {string} name - Name to be checked.
 * @param {boolean} [throwOnInvalid=true] - Specifies whether to throw if
 * name is not valid.
 * @returns {Boolean}
 * @throws {AccessControlError} - If `throwOnInvalid` is enabled and name
 * is invalid.
 */
export function validName(name: string, throwOnInvalid: boolean = true): boolean {
  if (typeof name !== 'string' || name.trim() === '') {
    if (!throwOnInvalid) return false;
    throw new AccessControlError('Invalid name, expected a valid string.');
  }
  if (RESERVED_KEYWORDS.indexOf(name) >= 0) {
    if (!throwOnInvalid) return false;
    throw new AccessControlError(`Cannot use reserved name: "${name}"`);
  }
  return true;
}

/**
 * Checks whether the given array does not contain a reserved keyword.
 *
 * @param {string|string[]} list - Name(s) to be checked.
 * @param {boolean} [throwOnInvalid=true] - Specifies whether to throw if
 * name is not valid.
 * @returns {Boolean}
 * @throws {AccessControlError} - If `throwOnInvalid` is enabled and name
 * is invalid.
 */
export function hasValidNames(list: any, throwOnInvalid: boolean = true): boolean {
  let allValid = true;
  each(toStringArray(list), (name: string) => {
    if (!validName(name, throwOnInvalid)) {
      allValid = false;
      return false; // break out of loop
    }
    // suppress tslint warning
    return true; // continue
  });
  return allValid;
}

/**
 * Inspects whether the given grants object has a valid structure and
 * configuration; and returns a restructured grants object that can be used
 * internally by AccessControl.
 *
 * @param {Object|Array} grantsObject - Original grants object to be inspected.
 * @returns {Object} - Inspected, restructured grants object.
 * @throws {AccessControlError} - If given grants object has an invalid
 * structure or configuration.
 */
export function getInspectedGrants(grantsObject: any): any {
  let grants = {};

  if (type(grantsObject) === 'object') {
    eachKey(grantsObject, (roleName: string) => {
      if (validName(roleName)) {
        // throws on failure
        return validRoleObject(grantsObject, roleName); // throws on failure
      }
      /* istanbul ignore next */
      return false;
      // above is redundant, previous checks will already throw on
      // failure so we'll never need to break early from this.
    });
    grants = grantsObject;
  } else if (type(grantsObject) === 'array') {
    grantsObject.forEach((item: any) => commitToGrants(grants, item, true));
  } else {
    throw new AccessControlError('Invalid grants object. Expected an array or object.');
  }
  return grants;
}

/**
 * Commits the given `IAccessInfo` object to the grants model.
 * CAUTION: if attributes is omitted, it will default to `['*']` which
 * means "all attributes allowed".
 * @param {Any} grants
 * @param {IAccessInfo} access
 * @param {boolean} normalizeAll
 *        Specifies whether to validate and normalize all properties of
 *        the inner `IAccessInfo` object, including `action` and `possession`.
 * @throws {Error} If `IAccessInfo` object fails validation.
 */
export function commitToGrants(grants: any, access: IAccessInfo, normalizeAll: boolean = false) {
  const newAccess = normalizeAccessInfo(access, normalizeAll);
  // grant.role also accepts an array, so treat it like it.
  (newAccess.role as string[]).forEach((role: string) => {
    if (validName(role) && !grants.hasOwnProperty(role)) {
      grants[role] = {};
    }

    const grantItem: any = grants[role];
    const ap: string = `${newAccess.action}:${newAccess.possession}`;
    (newAccess.resource as string[]).forEach((res: string) => {
      if (validName(res) && !grantItem.hasOwnProperty(res)) {
        grantItem[res] = {};
      }
      // If possession (in action value or as a separate property) is
      // omitted, it will default to "any". e.g. "create" —>
      // "create:any"
      grantItem[res][ap] = toStringArray(newAccess.attributes);
    });
  });
}

/**
 * When more than one role is passed, we union the permitted attributes
 * for all given roles; so we can check whether "at least one of these
 * roles" have the permission to execute this action.
 * e.g. `can(['admin', 'user']).createAny('video')`
 *
 * @param {Any} grants
 * @param {IQueryInfo} query
 * @returns {string[]} - An array of unioned attributes.
 */
export function getUnionAttrsOfRoles(grants: any, query: IQueryInfo): string[] {
  // throws if has any invalid property value
  const normalizedQuery = normalizeQueryInfo(query);

  let role: string;
  let resource: string;
  const attrsList: string[] = [];
  // get roles and extended roles in a flat array
  const roles: string[] = getFlatRoles(grants, normalizedQuery.role!);
  // iterate through roles and add permission attributes (array) of
  // each role to attrsList (array).
  roles.forEach((roleName: string, _: number) => {
    role = grants[roleName];
    // no need to check role existence #getFlatRoles() does that.
    resource = role[normalizedQuery.resource! as any];
    if (resource) {
      // e.g. resource['create:own']
      // If action has possession "any", it will also return
      // `granted=true` for "own", if "own" is not defined.
      attrsList.push(
        (
          resource[`${normalizedQuery.action}:${normalizedQuery.possession}` as any] ||
          resource[`${normalizedQuery.action}:any` as any] ||
          ([] as any)
        ).concat(),
      );
    }
  });

  let jointArray: string[] = [];
  attrsList.forEach((array: string) => {
    jointArray = [...jointArray, ...array];
  });
  const union = Array.from(new Set([...jointArray]));
  const hasWildcard = union.includes('*');
  for (let i = 0; i < union.length; i++) {
    if (
      (hasWildcard || union[i].includes('!')) &&
      !union[i].includes('!') &&
      !union[i].includes('*')
    ) {
      union.splice(i, 1);
    }
  }
  return union.includes('*') ? ['*'] : union.sort().reverse();
}
