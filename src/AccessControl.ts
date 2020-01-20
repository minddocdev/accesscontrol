import { Access } from './access';
import { Action, Possession } from './enums';
import { AccessControlError } from './error';
import { IAccessInfo, IQueryInfo } from './interfaces';
import { Permission } from './permission';
import { Query } from './query';
import { getInspectedGrants, getResources } from './utils';

export class AccessControl {
  private grants: any;

  /**
   * Initializes a new instance of `AccessControl` with the given grants.
   *
   * @param {Object|Array} [grants] - A list containing the access grant
   * definitions. See the structure of this object in the examples.
   */
  constructor(grants?: any) {
    // explicit undefined is not allowed
    let initGrants = grants;
    if (arguments.length === 0) {
      initGrants = {};
    }
    this.setGrants(initGrants);
  }

  getGrants(): any {
    return this.grants;
  }

  /**
   * Sets all access grants at once, from an object or array. Note that this
   * will reset the object and remove all previous grants.
   *
   * @param {Object|Array} grantsObject - A list containing the access grant
   * definitions.
   * @returns {AccessControl} - `AccessControl` instance for chaining.
   * @throws {AccessControlError} - If called after `.lock()` is called or if
   * passed grants object fails inspection.
   */
  setGrants(grantsObject: any): AccessControl {
    this.grants = getInspectedGrants(grantsObject);
    return this;
  }

  /**
   * Resets the internal grants object and removes all previous grants.
   *
   * @returns {AccessControl} - `AccessControl` instance for chaining.
   * @throws {AccessControlError} - If called after `.lock()` is called.
   */
  reset(): AccessControl {
    this.grants = {};
    return this;
  }

  /**
   * Gets all the unique roles that have at least one access information.
   *
   * @returns {Array<String>}
   */
  getRoles(): string[] {
    return Object.keys(this.grants);
  }

  /**
   * Gets all the unique resources that are granted access for at least one role.
   *
   * @returns {Array<String>}
   */
  getResources(): string[] {
    return getResources(this.grants);
  }

  /**
   * Checks whether the grants include the given role or roles.
   *
   * @param {string|string[]} role - Role to be checked. You can also pass an
   * array of strings to check multiple roles at once.
   * @returns {Boolean}
   */
  hasRole(role?: string | string[]): boolean {
    if (!this.grants) {
      return false;
    }
    if (Array.isArray(role)) {
      return role.every((item: string) => this.grants.hasOwnProperty(item));
    }
    return this.grants.hasOwnProperty(role);
  }

  /**
   * Checks whether grants include the given resource or resources.
   *
   * @param {string|string[]} resource - Resource to be checked. You can also pass an
   * array of strings to check multiple resources at once.
   * @returns {Boolean}
   */
  hasResource(resource?: string | string[]): boolean {
    const resources = this.getResources();
    if (Array.isArray(resource)) {
      return resource.every((item: string) => resources.indexOf(item) >= 0);
    }
    if (typeof resource !== 'string' || resource === '') return false;
    return resources.indexOf(resource) >= 0;
  }

  /**
   * Gets an instance of `Query` object. This is used to check whether the
   * defined access is allowed for the given role(s) and resource. This
   * object provides chainable methods to define and query the access
   * permissions to be checked.
   *
   * @param {string|Array|IQueryInfo} role - A single role (as a string), a
   * list of roles (as an array) or an `IQueryInfo` object that fully
   * or partially defines the access to be checked.
   * @returns {Query} - The returned object provides chainable methods to
   * define and query the access permissions to be checked.
   */
  can(role: string | string[] | IQueryInfo): Query {
    // throw on explicit undefined
    if (arguments.length !== 0 && role === undefined) {
      throw new AccessControlError('Invalid role(s): undefined');
    }
    // other explicit invalid values will be checked in constructor.
    return new Query(this.grants, role);
  }

  /**
   * Gets an instance of `Permission` object that checks and defines the
   * granted access permissions for the target resource and role. Normally
   * you would use `AccessControl#can()` method to check for permissions but
   * this is useful if you need to check at once by passing a `IQueryInfo`
   * object; instead of chaining methods (as in `.can(<role>).<action>(<resource>)`).
   *
   * @param {IQueryInfo} queryInfo - A fulfilled `IQueryInfo` object
   * @returns {Permission} - An object that provides properties and methods
   * that defines the granted access permissions.
   */
  permission(queryInfo: IQueryInfo): Permission {
    return new Permission(this.grants, queryInfo);
  }

  /**
   * Gets an instance of `Grant` (inner) object. This is used to grant access
   * to specified resource(s) for the given role(s).
   *
   * @param {string|Array<String>|IAccessInfo} [role] A single role (as a
   * string), a list of roles (as an array) or an `IAccessInfo` object that
   * fully or partially defines the access to be granted. This can be omitted
   * and chained with `.role()` to define the role.
   * @return {Access} - The returned object provides chainable properties to
   * build and define the access to be granted. See the examples for details.
   * @throws {AccessControlError} - If `role` is explicitly set to an invalid value.
   * @throws {AccessControlError} - If called after `.lock()` is called.
   */
  grant(role?: string | string[] | IAccessInfo): Access {
    // throw on explicit undefined
    if (arguments.length !== 0 && role === undefined) {
      throw new AccessControlError('Invalid role(s): undefined');
    }
    // other explicit invalid values will be checked in constructor.
    return new Access(this, role, false);
  }

  /**
   * Gets an instance of `Access` object. This is used to deny access to
   * specified resource(s) for the given role(s). Denying will only remove a
   * previously created grant. So if not granted before, you don't need to
   * deny an access.
   *
   * @param {string|Array<String>|IAccessInfo} role A single role (as a
   * string), a list of roles (as an array) or an `IAccessInfo` object that
   * fully or partially defines the access to be denied.
   * @return {Access} The returned object provides chainable properties to
   * build and define the access to be granted.
   * @throws {AccessControlError} - If `role` is explicitly set to an invalid value.
   * @throws {AccessControlError} - If called after `.lock()` is called.
   */
  deny(role?: string | string[] | IAccessInfo): Access {
    // throw on explicit undefined
    if (arguments.length !== 0 && role === undefined) {
      throw new AccessControlError('Invalid role(s): undefined');
    }
    // other explicit invalid values will be checked in constructor.
    return new Access(this, role, true);
  }

  /**
   * Documented separately in enums/Action
   */
  static get Action(): any {
    return Action;
  }

  /**
   * Documented separately in enums/Possession
   */
  static get Possession(): any {
    return Possession;
  }

  /**
   * Documented separately in AccessControlError
   */
  static get Error(): any {
    return AccessControlError;
  }

  /**
   * Checks whether the given object is an instance of `AccessControl.Error`.
   *
   * @param {Any} object Object to be checked.
   * @returns {Boolean}
   */
  static isAccessControlError(object: any): boolean {
    return object instanceof AccessControlError;
  }
}
