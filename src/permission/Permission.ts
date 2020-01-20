import { IQueryInfo } from '../interfaces';
import { getUnionAttrsOfRoles } from '../utils';

/**
 * Represents the inner `Permission` class that defines the granted or denied
 * access permissions for the target resource and role.
 */
export class Permission {
  private _: any = {};

  /**
   * Initializes a new `Permission` instance.
   *
   * @param {IQueryInfo} query An `IQueryInfo` object.
   */
  constructor(grants: any, query: IQueryInfo) {
    // Set attributes first, this also validates the `query` object.
    this._.attributes = getUnionAttrsOfRoles(grants, query);
    this._.role = query.role;
    this._.resource = query.resource;
  }

  /**
   * Specifies the roles for which the permission is queried for.
   * Even if the permission is queried for a single role, this will still
   * return an array.
   *
   * If the returned array has multiple roles, this does not necessarily mean
   * that the queried permission is granted or denied for each and all roles.
   * Note that when a permission is queried for multiple roles, attributes
   * are unioned (merged) for all given roles. This means "at least one of
   * these roles" have the permission for this action and resource attribute.
   */
  get roles(): string[] {
    return this._.role;
  }

  /**
   * Specifies the target resource for which the permission is queried for.
   */
  get resource(): string {
    return this._.resource;
  }

  /**
   * Gets an array of allowed attributes which are defined via
   * Glob notation. If access is not granted, this will be an empty array.
   *
   * Note that when a permission is queried for multiple roles, attributes
   * are unioned (merged) for all given roles. This means "at least one of
   * these roles" have the permission for this action and resource attribute.
   */
  get attributes(): string[] {
    return this._.attributes;
  }

  /**
   * Specifies whether the permission is granted. If `true`, this means at
   * least one attribute of the target resource is allowed.
   */
  get granted(): boolean {
    if (!this.attributes || this.attributes.length === 0) return false;
    // just one non-negated attribute is enough.
    return this.attributes.some((attr: string) => {
      return attr.trim().slice(0, 1) !== '!';
    });
  }
}
