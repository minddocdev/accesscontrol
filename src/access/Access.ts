import { AccessControl } from '../';
import { Action, Possession } from '../enums';
import { AccessControlError } from '../error';
import { IAccessInfo } from '../interfaces';
import {
  commitToGrants,
  extendRole,
  hasValidNames,
  isInfoFulfilled,
  preCreateRoles,
  resetAttributes,
  toStringArray,
  type,
} from '../utils';

// tslint:disable no-parameter-reassignment variable-name function-name
/**
 * Represents the inner `Access` class that helps build an access information
 * to be granted or denied; and finally commits it to the underlying grants
 * model. You can get a first instance of this class by calling
 * `AccessControl#grant()` or `AccessControl#deny()` methods.
 */
export class Access {
  /**
   * Inner `IAccessInfo` object.
   */
  protected _: IAccessInfo = {};

  /**
   * Main access control object.
   */
  protected _ac: AccessControl;

  /**
   * Main grants object.
   */
  protected _grants: any;

  /**
   * Initializes a new instance of `Access`.
   *
   * @param {AccessControl} ac
   *        AccessControl instance.
   * @param {String|Array<String>|IAccessInfo} [roleOrInfo]
   *        Either an `IAccessInfo` object, a single or an array of
   *        roles. If an object is passed, possession and attributes
   *        properties are optional. CAUTION: if attributes is omitted,
   *        and access is not denied, it will default to `["*"]` which means
   *        "all attributes allowed". If possession is omitted, it will
   *        default to `"any"`.
   * @param {Boolean} denied
   *        Specifies whether this `Access` is denied.
   */
  constructor(
    ac: AccessControl,
    roleOrInfo?: string | string[] | IAccessInfo,
    denied: boolean = false,
  ) {
    this._ac = ac;
    this._grants = (ac as any).grants;
    this._.denied = denied;

    if (typeof roleOrInfo === 'string' || Array.isArray(roleOrInfo)) {
      this.role(roleOrInfo);
    } else if (type(roleOrInfo) === 'object') {
      if (Object.keys(roleOrInfo!).length === 0) {
        throw new AccessControlError('Invalid IAccessInfo: {}');
      }
      // if an IAccessInfo instance is passed and it has 'action' defined, we
      // should directly commit it to grants.
      roleOrInfo!.denied = denied;
      this._ = resetAttributes(roleOrInfo!);
      if (isInfoFulfilled(this._)) commitToGrants(this._grants, this._, true);
    } else if (roleOrInfo !== undefined) {
      // undefined is allowed (`roleOrInfo` can be omitted) but throw if
      // some other type is passed.
      throw new AccessControlError(
        'Invalid role(s), expected a valid string, string[] or IAccessInfo.',
      );
    }
  }

  /**
   * Specifies whether this access is initially denied.
   */
  get denied(): boolean {
    return this._.denied!;
  }

  /**
   * A chaining method that sets the role(s) for this `Access` instance.
   * @param {String|Array<String>} value A single or array of roles.
   * @returns {Access} Self instance of `Access`.
   */
  role(value: string | string[]): Access {
    // in case chain is not terminated (e.g. `ac.grant('user')`) we'll
    // create/commit the roles to grants with an empty object.
    preCreateRoles(this._grants, value);
    this._.role = value;
    return this;
  }

  /**
   * A chaining method that sets the resource for this `Access` instance.
   * @param {String|Array<String>} value Target resource for this `Access` instance.
   * @returns {Access} Self instance of `Access`.
   */
  resource(value: string | string[]): Access {
    // this will throw if any item fails
    hasValidNames(value, true);
    this._.resource = value;
    return this;
  }

  /**
   * Sets the array of allowed attributes for this `Access` instance.
   * @param {String|Array<String>} value Attributes to be set.
   * @returns {Access} Self instance of `Access`.
   */
  attributes(value: string | string[]): Access {
    this._.attributes = value;
    return this;
  }

  /**
   * Sets the roles to be extended for this `Access` instance.
   *
   * @param {String|Array<String>} roles A single or array of roles.
   * @returns {Access} Self instance of `Access`.
   */
  extend(roles: string | string[]): Access {
    extendRole(this._grants, this._.role!, roles);
    return this;
  }

  /**
   * Shorthand to switch to a new `Access` instance with a different role
   * within the method chain.
   *
   * @param {String|Array<String>|IAccessInfo} [roleOrInfo] Either a single or
   * an array of roles or an `IAccessInfo` object.
   * @returns {Access} A new `Access` instance.
   */
  grant(roleOrInfo?: string | string[] | IAccessInfo): Access {
    return new Access(this._ac, roleOrInfo, false).attributes(['*']);
  }

  /**
   * Shorthand to switch to a new `Access` instance with a different
   * (or same) role within the method chain.
   *
   * @param {String|Array<String>|IAccessInfo} [roleOrInfo] Either a single or
   * an array of roles or an `IAccessInfo` object.
   * @returns {Access} A new `Access` instance.
   */
  deny(roleOrInfo?: string | string[] | IAccessInfo): Access {
    return new Access(this._ac, roleOrInfo, true).attributes([]);
  }

  /**
   * Sets the action to `"create"` and possession to `"own"` and commits the
   * current access instance to the underlying grant model.
   *
   * @param {String|Array<String>} [resource]
   *        Defines the target resource this access is granted or denied for.
   *        This is only optional if the resource is previously defined.
   *        If not defined and omitted, this will throw.
   * @param {String|Array<String>} [attributes]
   *        Defines the resource attributes for which the access is granted
   *        for. If access is denied previously by calling `.deny()` this
   *        will default to an empty array (which means no attributes allowed).
   *        Otherwise (if granted before via `.grant()`) this will default
   *        to `["*"]` (which means all attributes allowed.)
   * @throws {AccessControlError}
   *         If the access instance to be committed has any invalid data.
   * @returns {Access}
   *          Self instance of `Access` so that you can chain and define
   *          another access instance to be committed.
   */
  createOwn(resource?: string | string[], attributes?: string | string[]): Access {
    return this._prepareAndCommit(Action.CREATE, Possession.OWN, resource, attributes);
  }

  /**
   * Sets the action to `"create"` and possession to `"any"` and commits the
   * current access instance to the underlying grant model.
   *
   * @param {String|Array<String>} [resource]
   *        Defines the target resource this access is granted or denied for.
   *        This is only optional if the resource is previously defined.
   *        If not defined and omitted, this will throw.
   * @param {String|Array<String>} [attributes]
   *        Defines the resource attributes for which the access is granted
   *        for. If access is denied previously by calling `.deny()` this
   *        will default to an empty array (which means no attributes allowed).
   *        Otherwise (if granted before via `.grant()`) this will default
   *        to `["*"]` (which means all attributes allowed.)
   * @throws {AccessControlError}
   *         If the access instance to be committed has any invalid data.
   * @returns {Access}
   *          Self instance of `Access` so that you can chain and define
   *          another access instance to be committed.
   */
  createAny(resource?: string | string[], attributes?: string | string[]): Access {
    return this._prepareAndCommit(Action.CREATE, Possession.ANY, resource, attributes);
  }
  /**
   * Alias of `createAny`
   */
  create(resource?: string | string[], attributes?: string | string[]): Access {
    return this.createAny(resource, attributes);
  }

  /**
   * Sets the action to `"read"` and possession to `"own"` and commits the
   * current access instance to the underlying grant model.
   *
   * @param {String|Array<String>} [resource]
   *        Defines the target resource this access is granted or denied for.
   *        This is only optional if the resource is previously defined.
   *        If not defined and omitted, this will throw.
   * @param {String|Array<String>} [attributes]
   *        Defines the resource attributes for which the access is granted
   *        for. If access is denied previously by calling `.deny()` this
   *        will default to an empty array (which means no attributes allowed).
   *        Otherwise (if granted before via `.grant()`) this will default
   *        to `["*"]` (which means all attributes allowed.)
   * @throws {AccessControlError}
   *         If the access instance to be committed has any invalid data.
   * @returns {Access}
   *          Self instance of `Access` so that you can chain and define
   *          another access instance to be committed.
   */
  readOwn(resource?: string | string[], attributes?: string | string[]): Access {
    return this._prepareAndCommit(Action.READ, Possession.OWN, resource, attributes);
  }

  /**
   * Sets the action to `"read"` and possession to `"any"` and commits the
   * current access instance to the underlying grant model.
   *
   * @param {String|Array<String>} [resource]
   *        Defines the target resource this access is granted or denied for.
   *        This is only optional if the resource is previously defined.
   *        If not defined and omitted, this will throw.
   * @param {String|Array<String>} [attributes]
   *        Defines the resource attributes for which the access is granted
   *        for. If access is denied previously by calling `.deny()` this
   *        will default to an empty array (which means no attributes allowed).
   *        Otherwise (if granted before via `.grant()`) this will default
   *        to `["*"]` (which means all attributes allowed.)
   * @throws {AccessControlError}
   *         If the access instance to be committed has any invalid data.
   * @returns {Access}
   *          Self instance of `Access` so that you can chain and define
   *          another access instance to be committed.
   */
  readAny(resource?: string | string[], attributes?: string | string[]): Access {
    return this._prepareAndCommit(Action.READ, Possession.ANY, resource, attributes);
  }
  /**
   * Alias of `readAny`
   */
  read(resource?: string | string[], attributes?: string | string[]): Access {
    return this.readAny(resource, attributes);
  }

  /**
   * Sets the action to `"update"` and possession to `"own"` and commits the
   * current access instance to the underlying grant model.
   *
   * @param {String|Array<String>} [resource]
   *        Defines the target resource this access is granted or denied for.
   *        This is only optional if the resource is previously defined.
   *        If not defined and omitted, this will throw.
   * @param {String|Array<String>} [attributes]
   *        Defines the resource attributes for which the access is granted
   *        for. If access is denied previously by calling `.deny()` this
   *        will default to an empty array (which means no attributes allowed).
   *        Otherwise (if granted before via `.grant()`) this will default
   *        to `["*"]` (which means all attributes allowed.)
   * @throws {AccessControlError}
   *         If the access instance to be committed has any invalid data.
   * @returns {Access}
   *          Self instance of `Access` so that you can chain and define
   *          another access instance to be committed.
   */
  updateOwn(resource?: string | string[], attributes?: string | string[]): Access {
    return this._prepareAndCommit(Action.UPDATE, Possession.OWN, resource, attributes);
  }

  /**
   * Sets the action to `"update"` and possession to `"any"` and commits the
   * current access instance to the underlying grant model.
   *
   * @param {String|Array<String>} [resource]
   *        Defines the target resource this access is granted or denied for.
   *        This is only optional if the resource is previously defined.
   *        If not defined and omitted, this will throw.
   * @param {String|Array<String>} [attributes]
   *        Defines the resource attributes for which the access is granted
   *        for. If access is denied previously by calling `.deny()` this
   *        will default to an empty array (which means no attributes allowed).
   *        Otherwise (if granted before via `.grant()`) this will default
   *        to `["*"]` (which means all attributes allowed.)
   * @throws {AccessControlError}
   *         If the access instance to be committed has any invalid data.
   * @returns {Access}
   *          Self instance of `Access` so that you can chain and define
   *          another access instance to be committed.
   */
  updateAny(resource?: string | string[], attributes?: string | string[]): Access {
    return this._prepareAndCommit(Action.UPDATE, Possession.ANY, resource, attributes);
  }
  /**
   * Alias of `updateAny`
   */
  update(resource?: string | string[], attributes?: string | string[]): Access {
    return this.updateAny(resource, attributes);
  }

  /**
   * Sets the action to `"delete"` and possession to `"own"` and commits the
   * current access instance to the underlying grant model.
   *
   * @param {String|Array<String>} [resource]
   *        Defines the target resource this access is granted or denied for.
   *        This is only optional if the resource is previously defined.
   *        If not defined and omitted, this will throw.
   * @param {String|Array<String>} [attributes]
   *        Defines the resource attributes for which the access is granted
   *        for. If access is denied previously by calling `.deny()` this
   *        will default to an empty array (which means no attributes allowed).
   *        Otherwise (if granted before via `.grant()`) this will default
   *        to `["*"]` (which means all attributes allowed.)
   * @throws {AccessControlError}
   *         If the access instance to be committed has any invalid data.
   * @returns {Access}
   *          Self instance of `Access` so that you can chain and define
   *          another access instance to be committed.
   */
  deleteOwn(resource?: string | string[], attributes?: string | string[]): Access {
    return this._prepareAndCommit(Action.DELETE, Possession.OWN, resource, attributes);
  }

  /**
   * Sets the action to `"delete"` and possession to `"any"` and commits the
   * current access instance to the underlying grant model.
   *
   * @param {String|Array<String>} [resource]
   *        Defines the target resource this access is granted or denied for.
   *        This is only optional if the resource is previously defined.
   *        If not defined and omitted, this will throw.
   * @param {String|Array<String>} [attributes]
   *        Defines the resource attributes for which the access is granted
   *        for. If access is denied previously by calling `.deny()` this
   *        will default to an empty array (which means no attributes allowed).
   *        Otherwise (if granted before via `.grant()`) this will default
   *        to `["*"]` (which means all attributes allowed.)
   * @throws {AccessControlError}
   *         If the access instance to be committed has any invalid data.
   * @returns {Access}
   *          Self instance of `Access` so that you can chain and define
   *          another access instance to be committed.
   */
  deleteAny(resource?: string | string[], attributes?: string | string[]): Access {
    return this._prepareAndCommit(Action.DELETE, Possession.ANY, resource, attributes);
  }
  /**
   * Alias of `deleteAny`
   */
  delete(resource?: string | string[], attributes?: string | string[]): Access {
    return this.deleteAny(resource, attributes);
  }

  private _prepareAndCommit(
    action: string,
    possession: string,
    resource?: string | string[],
    attributes?: string | string[],
  ): Access {
    this._.action = action;
    this._.possession = possession;
    if (resource) this._.resource = resource;

    if (this._.denied) {
      this._.attributes = [];
    } else {
      // if omitted and not denied, all attributes are allowed
      this._.attributes = attributes ? toStringArray(attributes) : ['*'];
    }

    commitToGrants(this._grants, this._, false);

    // important: reset attributes for chained methods
    this._.attributes = undefined;

    return this;
  }
}
