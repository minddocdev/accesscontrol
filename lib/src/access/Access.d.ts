import { AccessControl } from '../';
import { IAccessInfo } from '../interfaces';
export declare class Access {
    protected _: IAccessInfo;
    protected _ac: AccessControl;
    protected _grants: any;
    constructor(ac: AccessControl, roleOrInfo?: string | string[] | IAccessInfo, denied?: boolean);
    get denied(): boolean;
    role(value: string | string[]): Access;
    resource(value: string | string[]): Access;
    attributes(value: string | string[]): Access;
    extend(roles: string | string[]): Access;
    grant(roleOrInfo?: string | string[] | IAccessInfo): Access;
    deny(roleOrInfo?: string | string[] | IAccessInfo): Access;
    createOwn(resource?: string | string[], attributes?: string | string[]): Access;
    createAny(resource?: string | string[], attributes?: string | string[]): Access;
    create(resource?: string | string[], attributes?: string | string[]): Access;
    readOwn(resource?: string | string[], attributes?: string | string[]): Access;
    readAny(resource?: string | string[], attributes?: string | string[]): Access;
    read(resource?: string | string[], attributes?: string | string[]): Access;
    updateOwn(resource?: string | string[], attributes?: string | string[]): Access;
    updateAny(resource?: string | string[], attributes?: string | string[]): Access;
    update(resource?: string | string[], attributes?: string | string[]): Access;
    deleteOwn(resource?: string | string[], attributes?: string | string[]): Access;
    deleteAny(resource?: string | string[], attributes?: string | string[]): Access;
    delete(resource?: string | string[], attributes?: string | string[]): Access;
    private _prepareAndCommit;
}
