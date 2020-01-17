import { IQueryInfo } from '../core';
declare class Permission {
    private _;
    constructor(grants: any, query: IQueryInfo);
    get roles(): string[];
    get resource(): string;
    get attributes(): string[];
    get granted(): boolean;
}
export { Permission };
