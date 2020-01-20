import { IQueryInfo } from '../interfaces';
import { Permission } from '../permission';
export declare class Query {
    protected _: IQueryInfo;
    protected _grants: any;
    constructor(grants: any, roleOrInfo?: string | string[] | IQueryInfo);
    role(role: string | string[]): Query;
    resource(resource: string): Query;
    createOwn(resource?: string): Permission;
    createAny(resource?: string): Permission;
    create(resource?: string): Permission;
    readOwn(resource?: string): Permission;
    readAny(resource?: string): Permission;
    read(resource?: string): Permission;
    updateOwn(resource?: string): Permission;
    updateAny(resource?: string): Permission;
    update(resource?: string): Permission;
    deleteOwn(resource?: string): Permission;
    deleteAny(resource?: string): Permission;
    delete(resource?: string): Permission;
    private _getPermission;
}
