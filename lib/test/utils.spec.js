"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils = require("../src/utils");
const helper_1 = require("./helper");
describe('Test Suite: utils (generic)', () => {
    test('#type()', () => {
        expect(utils.type(undefined)).toEqual('undefined');
        expect(utils.type(null)).toEqual('null');
        expect(utils.type({})).toEqual('object');
        expect(utils.type([])).toEqual('array');
        expect(utils.type('')).toEqual('string');
        expect(utils.type(1)).toEqual('number');
        expect(utils.type(true)).toEqual('boolean');
    });
    test('#hasDefined()', () => {
        const o = { prop: 1, def: undefined };
        expect(utils.hasDefined(o, 'prop')).toBe(true);
        expect(utils.hasDefined(o, 'def')).toBe(false);
        expect(utils.hasDefined(o, 'none')).toBe(false);
        expect(() => utils.hasDefined(null, 'prop')).toThrow();
    });
    test('#toStringArray()', () => {
        expect(utils.toStringArray([])).toEqual([]);
        expect(utils.toStringArray('a')).toEqual(['a']);
        expect(utils.toStringArray('a,b,c')).toEqual(['a', 'b', 'c']);
        expect(utils.toStringArray('a, b,  c  \n')).toEqual(['a', 'b', 'c']);
        expect(utils.toStringArray('a ; b,c')).toEqual(['a', 'b', 'c']);
        expect(utils.toStringArray('a;b; c')).toEqual(['a', 'b', 'c']);
        expect(utils.toStringArray(1)).toEqual([]);
        expect(utils.toStringArray(true)).toEqual([]);
        expect(utils.toStringArray(false)).toEqual([]);
        expect(utils.toStringArray(null)).toEqual([]);
        expect(utils.toStringArray(undefined)).toEqual([]);
    });
    test('#isFilledStringArray(), #isEmptyArray()', () => {
        expect(utils.isFilledStringArray([])).toBe(true);
        expect(utils.isFilledStringArray([''])).toBe(false);
        expect(utils.isFilledStringArray(['a'])).toBe(true);
        expect(utils.isFilledStringArray(['a', ''])).toBe(false);
        expect(utils.isFilledStringArray([1])).toBe(false);
        expect(utils.isFilledStringArray([null])).toBe(false);
        expect(utils.isFilledStringArray([undefined])).toBe(false);
        expect(utils.isFilledStringArray([false])).toBe(false);
        expect(utils.isEmptyArray([])).toBe(true);
        expect(utils.isEmptyArray([1])).toBe(false);
        expect(utils.isEmptyArray([''])).toBe(false);
        expect(utils.isEmptyArray([null])).toBe(false);
        expect(utils.isEmptyArray([undefined])).toBe(false);
        expect(utils.isEmptyArray('[]')).toBe(false);
        expect(utils.isEmptyArray(1)).toBe(false);
        expect(utils.isEmptyArray(null)).toBe(false);
        expect(utils.isEmptyArray(undefined)).toBe(false);
        expect(utils.isEmptyArray(true)).toBe(false);
    });
    test('#pushUniq(), #uniqConcat()', () => {
        const original = ['a', 'b', 'c'];
        const arr = original.concat();
        expect(utils.pushUniq(arr, 'a')).toEqual(original);
        expect(utils.pushUniq(arr, 'd')).toEqual(original.concat(['d']));
        expect(utils.uniqConcat(original, ['a'])).toEqual(original);
        expect(utils.uniqConcat(original, ['d'])).toEqual(original.concat(['d']));
    });
    test('#each(), #eachKey()', () => {
        const original = [1, 2, 3];
        let items = [];
        utils.each(original, (item) => items.push(item));
        expect(items).toEqual(original);
        items = [];
        utils.each(original, (item) => {
            items.push(item);
            return item < 2;
        });
        expect(items).toEqual([1, 2]);
        const o = { x: 0, y: 1, z: 2 };
        const d = {};
        utils.eachKey(o, (key, index) => {
            d[key] = index;
        });
        expect(d).toEqual(o);
    });
});
describe('Test Suite: utils (core)', () => {
    test('#validName(), #hasValidNames()', () => {
        let valid = 'someName';
        expect(utils.validName(valid)).toBe(true);
        expect(utils.validName(valid, false)).toBe(true);
        expect(utils.validName(valid, false)).toBe(true);
        let invalid = utils.RESERVED_KEYWORDS[0];
        helper_1.helper.expectAccessControlError(() => utils.validName(invalid));
        helper_1.helper.expectAccessControlError(() => utils.validName(invalid, true));
        expect(utils.validName(invalid, false)).toBe(false);
        expect(utils.validName('', false)).toBe(false);
        expect(utils.validName(1, false)).toBe(false);
        expect(utils.validName(null, false)).toBe(false);
        expect(utils.validName(true, false)).toBe(false);
        valid = ['valid', 'name'];
        expect(utils.hasValidNames(valid)).toBe(true);
        expect(utils.hasValidNames(valid, false)).toBe(true);
        expect(utils.hasValidNames(valid, false)).toBe(true);
        invalid = ['valid', utils.RESERVED_KEYWORDS[utils.RESERVED_KEYWORDS.length - 1]];
        helper_1.helper.expectAccessControlError(() => utils.hasValidNames(invalid));
        helper_1.helper.expectAccessControlError(() => utils.hasValidNames(invalid, true));
        expect(utils.hasValidNames(invalid, false)).toBe(false);
    });
    test('#validResourceObject()', () => {
        helper_1.helper.expectAccessControlError(() => utils.validResourceObject(null));
        helper_1.helper.expectAccessControlError(() => utils.validResourceObject(null));
        expect(utils.validResourceObject({ create: [] })).toBe(true);
        expect(utils.validResourceObject({ 'create:any': ['*', '!id'] })).toBe(true);
        expect(utils.validResourceObject({ 'update:own': ['*'] })).toBe(true);
        helper_1.helper.expectAccessControlError(() => utils.validResourceObject({ invalid: [], create: [] }));
        helper_1.helper.expectAccessControlError(() => utils.validResourceObject({ 'invalid:any': [] }));
        helper_1.helper.expectAccessControlError(() => utils.validResourceObject({ 'invalid:any': [''] }));
        helper_1.helper.expectAccessControlError(() => utils.validResourceObject({ 'read:own': ['*'], 'invalid:own': [] }));
        helper_1.helper.expectAccessControlError(() => utils.validResourceObject({ 'create:all': [] }));
        helper_1.helper.expectAccessControlError(() => utils.validResourceObject({ 'create:all': [] }));
        helper_1.helper.expectAccessControlError(() => utils.validResourceObject({ create: null }));
        helper_1.helper.expectAccessControlError(() => utils.validResourceObject({ 'create:own': undefined }));
        helper_1.helper.expectAccessControlError(() => utils.validResourceObject({ 'read:own': [], 'create:any': [''] }));
        helper_1.helper.expectAccessControlError(() => utils.validResourceObject({ 'create:any': ['*', ''] }));
    });
    test('#validRoleObject()', () => {
        const grants = { admin: { account: { 'read:any': ['*'] } } };
        expect(utils.validRoleObject(grants, 'admin')).toBe(true);
        grants.admin = { account: ['*'] };
        helper_1.helper.expectAccessControlError(() => utils.validRoleObject(grants, 'admin'));
        grants.admin = { account: { 'read:own': ['*'] } };
        expect(() => utils.validRoleObject(grants, 'admin')).not.toThrow();
        grants.admin = { account: { read: ['*'] } };
        expect(() => utils.validRoleObject(grants, 'admin')).not.toThrow();
        grants.admin = { account: { 'read:all': ['*'] } };
        helper_1.helper.expectAccessControlError(() => utils.validRoleObject(grants, 'admin'));
        grants.admin = { $extend: ['*'] };
        helper_1.helper.expectAccessControlError(() => utils.validRoleObject(grants, 'admin'));
        grants.user = { account: { 'read:own': ['*'] } };
        grants.admin = { $extend: ['user'] };
        expect(() => utils.validRoleObject(grants, 'admin')).not.toThrow();
        grants.admin = { $: { account: { 'read:own': ['*'] } } };
        helper_1.helper.expectAccessControlError(() => utils.validRoleObject(grants, 'admin'));
        grants.admin = { account: [] };
        helper_1.helper.expectAccessControlError(() => utils.validRoleObject(grants, 'admin'));
        grants.admin = { account: { 'read:own': [''] } };
        helper_1.helper.expectAccessControlError(() => utils.validRoleObject(grants, 'admin'));
        grants.admin = { account: null };
        helper_1.helper.expectAccessControlError(() => utils.validRoleObject(grants, 'admin'));
    });
    test('#normalizeQueryInfo(), #normalizeAccessInfo()', () => {
        helper_1.helper.expectAccessControlError(() => utils.normalizeQueryInfo({ role: 1 }));
        helper_1.helper.expectAccessControlError(() => utils.normalizeQueryInfo({ role: [] }));
        helper_1.helper.expectAccessControlError(() => utils.normalizeQueryInfo({ role: '' }));
        helper_1.helper.expectAccessControlError(() => utils.normalizeQueryInfo({ role: 'sa', resource: '' }));
        helper_1.helper.expectAccessControlError(() => utils.normalizeQueryInfo({ role: 'sa', resource: null }));
        helper_1.helper.expectAccessControlError(() => utils.normalizeQueryInfo({ role: 'sa', resource: [] }));
        helper_1.helper.expectAccessControlError(() => utils.normalizeAccessInfo({ role: [] }));
        helper_1.helper.expectAccessControlError(() => utils.normalizeAccessInfo({ role: '' }));
        helper_1.helper.expectAccessControlError(() => utils.normalizeAccessInfo({ role: 1 }));
        helper_1.helper.expectAccessControlError(() => utils.normalizeAccessInfo({ role: 'sa', resource: '' }));
        helper_1.helper.expectAccessControlError(() => utils.normalizeAccessInfo({ role: 'sa', resource: null }));
        helper_1.helper.expectAccessControlError(() => utils.normalizeAccessInfo({ role: 'sa', resource: [] }));
    });
    test('#getRoleHierarchyOf()', () => {
        const grants = {
            admin: {
                $extend: ['user'],
            },
        };
        helper_1.helper.expectAccessControlError(() => utils.getRoleHierarchyOf(grants, 'admin'));
        grants.admin = { $extend: ['admin'] };
        helper_1.helper.expectAccessControlError(() => utils.getRoleHierarchyOf(grants, 'admin'));
        grants.admin = { account: { 'read:any': ['*'] } };
        helper_1.helper.expectAccessControlError(() => utils.getRoleHierarchyOf(grants, ''));
    });
    test('#getFlatRoles()', () => {
        helper_1.helper.expectAccessControlError(() => utils.getFlatRoles({}, ''));
    });
    test('#getNonExistentRoles()', () => {
        const grants = {
            admin: {
                account: { 'read:any': ['*'] },
            },
        };
        expect(utils.getNonExistentRoles(grants, [])).toEqual([]);
        expect(utils.getNonExistentRoles(grants, [''])).toEqual(['']);
    });
    test('#getCrossExtendingRole()', () => {
        const grants = {
            user: {},
            admin: {
                $extend: ['user', 'editor'],
            },
            editor: {
                $extend: ['admin'],
            },
        };
        expect(utils.getCrossExtendingRole(grants, 'admin', ['admin'])).toEqual(null);
        expect(utils.getCrossExtendingRole(grants, 'admin', ['user'])).toEqual(null);
        helper_1.helper.expectAccessControlError(() => utils.getCrossExtendingRole(grants, 'user', ['admin']));
    });
    test('#extendRole()', () => {
        const grants = {
            user: {},
            admin: {
                $extend: ['user', 'editor'],
            },
            editor: {
                $extend: ['admin'],
            },
            viewer: {},
        };
        helper_1.helper.expectAccessControlError(() => utils.extendRole(grants, 'nonexisting', 'user'));
        helper_1.helper.expectAccessControlError(() => utils.extendRole(grants, 'admin', 'nonexisting'));
        helper_1.helper.expectAccessControlError(() => utils.extendRole(grants, 'admin', 'editor'));
        helper_1.helper.expectAccessControlError(() => utils.extendRole(grants, '$', 'user'));
        expect(() => utils.extendRole(grants, 'admin', 'viewer')).not.toThrow();
    });
    test('#getUnionAttrsOfRoles()', () => {
        const grants = {
            user: {
                account: {
                    'read:own': ['*'],
                },
            },
            admin: {
                $extend: ['user'],
            },
        };
        const query = {
            role: 'admin',
            resource: 'account',
            action: 'read',
        };
        expect(utils.getUnionAttrsOfRoles(grants, query)).toEqual([]);
        query.role = 'nonexisting';
        helper_1.helper.expectAccessControlError(() => utils.getUnionAttrsOfRoles(grants, query));
    });
});
//# sourceMappingURL=utils.spec.js.map