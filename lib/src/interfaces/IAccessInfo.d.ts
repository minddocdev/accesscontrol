export interface IAccessInfo {
    role?: string | string[];
    resource?: string | string[];
    attributes?: string | string[];
    action?: string;
    possession?: string;
    denied?: boolean;
}
