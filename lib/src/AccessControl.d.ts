import { Access, IAccessInfo, IQueryInfo, Permission, Query } from './core';
declare class AccessControl {
    private grants;
    constructor(grants?: any);
    getGrants(): any;
    setGrants(grantsObject: any): AccessControl;
    reset(): AccessControl;
    getRoles(): string[];
    getResources(): string[];
    hasRole(role?: string | string[]): boolean;
    hasResource(resource?: string | string[]): boolean;
    can(role: string | string[] | IQueryInfo): Query;
    permission(queryInfo: IQueryInfo): Permission;
    grant(role?: string | string[] | IAccessInfo): Access;
    deny(role?: string | string[] | IAccessInfo): Access;
    static get Action(): any;
    static get Possession(): any;
    static get Error(): any;
    static isAccessControlError(object: any): boolean;
}
export { AccessControl };
