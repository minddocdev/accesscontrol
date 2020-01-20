import { IQueryInfo } from '../interfaces';
export declare class Permission {
    private _;
    constructor(grants: any, query: IQueryInfo);
    get roles(): string[];
    get resource(): string;
    get attributes(): string[];
    get granted(): boolean;
}
