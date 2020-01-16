"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const src_1 = require("../src");
const utils_1 = require("../src/utils");
const helper_1 = require("./helper");
describe('Test Suite: utils (generic)', () => {
    test('#type()', () => {
        expect(utils_1.utils.type(undefined)).toEqual('undefined');
        expect(utils_1.utils.type(null)).toEqual('null');
        expect(utils_1.utils.type({})).toEqual('object');
        expect(utils_1.utils.type([])).toEqual('array');
        expect(utils_1.utils.type('')).toEqual('string');
        expect(utils_1.utils.type(1)).toEqual('number');
        expect(utils_1.utils.type(true)).toEqual('boolean');
    });
    test('#hasDefined()', () => {
        const o = { prop: 1, def: undefined };
        expect(utils_1.utils.hasDefined(o, 'prop')).toBe(true);
        expect(utils_1.utils.hasDefined(o, 'def')).toBe(false);
        expect(utils_1.utils.hasDefined(o, 'none')).toBe(false);
        expect(() => utils_1.utils.hasDefined(null, 'prop')).toThrow();
    });
    test('#toStringArray()', () => {
        expect(utils_1.utils.toStringArray([])).toEqual([]);
        expect(utils_1.utils.toStringArray('a')).toEqual(['a']);
        expect(utils_1.utils.toStringArray('a,b,c')).toEqual(['a', 'b', 'c']);
        expect(utils_1.utils.toStringArray('a, b,  c  \n')).toEqual(['a', 'b', 'c']);
        expect(utils_1.utils.toStringArray('a ; b,c')).toEqual(['a', 'b', 'c']);
        expect(utils_1.utils.toStringArray('a;b; c')).toEqual(['a', 'b', 'c']);
        expect(utils_1.utils.toStringArray(1)).toEqual([]);
        expect(utils_1.utils.toStringArray(true)).toEqual([]);
        expect(utils_1.utils.toStringArray(false)).toEqual([]);
        expect(utils_1.utils.toStringArray(null)).toEqual([]);
        expect(utils_1.utils.toStringArray(undefined)).toEqual([]);
    });
    test('#isFilledStringArray(), #isEmptyArray()', () => {
        expect(utils_1.utils.isFilledStringArray([])).toBe(true);
        expect(utils_1.utils.isFilledStringArray([''])).toBe(false);
        expect(utils_1.utils.isFilledStringArray(['a'])).toBe(true);
        expect(utils_1.utils.isFilledStringArray(['a', ''])).toBe(false);
        expect(utils_1.utils.isFilledStringArray([1])).toBe(false);
        expect(utils_1.utils.isFilledStringArray([null])).toBe(false);
        expect(utils_1.utils.isFilledStringArray([undefined])).toBe(false);
        expect(utils_1.utils.isFilledStringArray([false])).toBe(false);
        expect(utils_1.utils.isEmptyArray([])).toBe(true);
        expect(utils_1.utils.isEmptyArray([1])).toBe(false);
        expect(utils_1.utils.isEmptyArray([''])).toBe(false);
        expect(utils_1.utils.isEmptyArray([null])).toBe(false);
        expect(utils_1.utils.isEmptyArray([undefined])).toBe(false);
        expect(utils_1.utils.isEmptyArray('[]')).toBe(false);
        expect(utils_1.utils.isEmptyArray(1)).toBe(false);
        expect(utils_1.utils.isEmptyArray(null)).toBe(false);
        expect(utils_1.utils.isEmptyArray(undefined)).toBe(false);
        expect(utils_1.utils.isEmptyArray(true)).toBe(false);
    });
    test('#pushUniq(), #uniqConcat(), #subtractArray()', () => {
        const original = ['a', 'b', 'c'];
        const arr = original.concat();
        expect(utils_1.utils.pushUniq(arr, 'a')).toEqual(original);
        expect(utils_1.utils.pushUniq(arr, 'd')).toEqual(original.concat(['d']));
        expect(utils_1.utils.uniqConcat(original, ['a'])).toEqual(original);
        expect(utils_1.utils.uniqConcat(original, ['d'])).toEqual(original.concat(['d']));
        expect(utils_1.utils.subtractArray(original, ['a'])).toEqual(['b', 'c']);
        expect(utils_1.utils.subtractArray(original, ['d'])).toEqual(original);
    });
    test('#deepFreeze()', () => {
        expect(utils_1.utils.deepFreeze()).toBeUndefined();
        const o = {
            x: 1,
            inner: {
                x: 2,
            },
        };
        expect(utils_1.utils.deepFreeze(o)).toEqual(expect.any(Object));
        expect(() => o.x = 5).toThrow();
        expect(() => o.inner = {}).toThrow();
        expect(() => o.inner.x = 6).toThrow();
    });
    test('#each(), #eachKey()', () => {
        const original = [1, 2, 3];
        let items = [];
        utils_1.utils.each(original, (item) => items.push(item));
        expect(items).toEqual(original);
        items = [];
        utils_1.utils.each(original, (item) => {
            items.push(item);
            return item < 2;
        });
        expect(items).toEqual([1, 2]);
        const o = { x: 0, y: 1, z: 2 };
        const d = {};
        utils_1.utils.eachKey(o, (key, index) => {
            d[key] = index;
        });
        expect(d).toEqual(o);
    });
});
describe('Test Suite: utils (core)', () => {
    test('#validName(), #hasValidNames()', () => {
        let valid = 'someName';
        expect(utils_1.utils.validName(valid)).toBe(true);
        expect(utils_1.utils.validName(valid, false)).toBe(true);
        expect(utils_1.utils.validName(valid, false)).toBe(true);
        let invalid = utils_1.RESERVED_KEYWORDS[0];
        helper_1.helper.expectACError(() => utils_1.utils.validName(invalid));
        helper_1.helper.expectACError(() => utils_1.utils.validName(invalid, true));
        expect(utils_1.utils.validName(invalid, false)).toBe(false);
        expect(utils_1.utils.validName('', false)).toBe(false);
        expect(utils_1.utils.validName(1, false)).toBe(false);
        expect(utils_1.utils.validName(null, false)).toBe(false);
        expect(utils_1.utils.validName(true, false)).toBe(false);
        valid = ['valid', 'name'];
        expect(utils_1.utils.hasValidNames(valid)).toBe(true);
        expect(utils_1.utils.hasValidNames(valid, false)).toBe(true);
        expect(utils_1.utils.hasValidNames(valid, false)).toBe(true);
        invalid = ['valid', utils_1.RESERVED_KEYWORDS[utils_1.RESERVED_KEYWORDS.length - 1]];
        helper_1.helper.expectACError(() => utils_1.utils.hasValidNames(invalid));
        helper_1.helper.expectACError(() => utils_1.utils.hasValidNames(invalid, true));
        expect(utils_1.utils.hasValidNames(invalid, false)).toBe(false);
    });
    test('#validResourceObject()', () => {
        helper_1.helper.expectACError(() => utils_1.utils.validResourceObject(null));
        helper_1.helper.expectACError(() => utils_1.utils.validResourceObject(null));
        expect(utils_1.utils.validResourceObject({ create: [] })).toBe(true);
        expect(utils_1.utils.validResourceObject({ 'create:any': ['*', '!id'] })).toBe(true);
        expect(utils_1.utils.validResourceObject({ 'update:own': ['*'] })).toBe(true);
        helper_1.helper.expectACError(() => utils_1.utils.validResourceObject({ invalid: [], create: [] }));
        helper_1.helper.expectACError(() => utils_1.utils.validResourceObject({ 'invalid:any': [] }));
        helper_1.helper.expectACError(() => utils_1.utils.validResourceObject({ 'invalid:any': [''] }));
        helper_1.helper.expectACError(() => utils_1.utils.validResourceObject({ 'read:own': ['*'], 'invalid:own': [] }));
        helper_1.helper.expectACError(() => utils_1.utils.validResourceObject({ 'create:all': [] }));
        helper_1.helper.expectACError(() => utils_1.utils.validResourceObject({ 'create:all': [] }));
        helper_1.helper.expectACError(() => utils_1.utils.validResourceObject({ create: null }));
        helper_1.helper.expectACError(() => utils_1.utils.validResourceObject({ 'create:own': undefined }));
        helper_1.helper.expectACError(() => utils_1.utils.validResourceObject({ 'read:own': [], 'create:any': [''] }));
        helper_1.helper.expectACError(() => utils_1.utils.validResourceObject({ 'create:any': ['*', ''] }));
    });
    test('#validRoleObject()', () => {
        const grants = { admin: { account: { 'read:any': ['*'] } } };
        expect(utils_1.utils.validRoleObject(grants, 'admin')).toBe(true);
        grants.admin = { account: ['*'] };
        helper_1.helper.expectACError(() => utils_1.utils.validRoleObject(grants, 'admin'));
        grants.admin = { account: { 'read:own': ['*'] } };
        expect(() => utils_1.utils.validRoleObject(grants, 'admin')).not.toThrow();
        grants.admin = { account: { read: ['*'] } };
        expect(() => utils_1.utils.validRoleObject(grants, 'admin')).not.toThrow();
        grants.admin = { account: { 'read:all': ['*'] } };
        helper_1.helper.expectACError(() => utils_1.utils.validRoleObject(grants, 'admin'));
        grants.admin = { $extend: ['*'] };
        helper_1.helper.expectACError(() => utils_1.utils.validRoleObject(grants, 'admin'));
        grants.user = { account: { 'read:own': ['*'] } };
        grants.admin = { $extend: ['user'] };
        expect(() => utils_1.utils.validRoleObject(grants, 'admin')).not.toThrow();
        grants.admin = { $: { account: { 'read:own': ['*'] } } };
        helper_1.helper.expectACError(() => utils_1.utils.validRoleObject(grants, 'admin'));
        grants.admin = { account: [] };
        helper_1.helper.expectACError(() => utils_1.utils.validRoleObject(grants, 'admin'));
        grants.admin = { account: { 'read:own': [''] } };
        helper_1.helper.expectACError(() => utils_1.utils.validRoleObject(grants, 'admin'));
        grants.admin = { account: null };
        helper_1.helper.expectACError(() => utils_1.utils.validRoleObject(grants, 'admin'));
    });
    test('#normalizeQueryInfo(), #normalizeAccessInfo()', () => {
        helper_1.helper.expectACError(() => utils_1.utils.normalizeQueryInfo({ role: 1 }));
        helper_1.helper.expectACError(() => utils_1.utils.normalizeQueryInfo({ role: [] }));
        helper_1.helper.expectACError(() => utils_1.utils.normalizeQueryInfo({ role: '' }));
        helper_1.helper.expectACError(() => utils_1.utils.normalizeQueryInfo({ role: 'sa', resource: '' }));
        helper_1.helper.expectACError(() => utils_1.utils.normalizeQueryInfo({ role: 'sa', resource: null }));
        helper_1.helper.expectACError(() => utils_1.utils.normalizeQueryInfo({ role: 'sa', resource: [] }));
        helper_1.helper.expectACError(() => utils_1.utils.normalizeAccessInfo({ role: [] }));
        helper_1.helper.expectACError(() => utils_1.utils.normalizeAccessInfo({ role: '' }));
        helper_1.helper.expectACError(() => utils_1.utils.normalizeAccessInfo({ role: 1 }));
        helper_1.helper.expectACError(() => utils_1.utils.normalizeAccessInfo({ role: 'sa', resource: '' }));
        helper_1.helper.expectACError(() => utils_1.utils.normalizeAccessInfo({ role: 'sa', resource: null }));
        helper_1.helper.expectACError(() => utils_1.utils.normalizeAccessInfo({ role: 'sa', resource: [] }));
    });
    test('#getRoleHierarchyOf()', () => {
        const grants = {
            admin: {
                $extend: ['user'],
            },
        };
        helper_1.helper.expectACError(() => utils_1.utils.getRoleHierarchyOf(grants, 'admin'));
        grants.admin = { $extend: ['admin'] };
        helper_1.helper.expectACError(() => utils_1.utils.getRoleHierarchyOf(grants, 'admin'));
        grants.admin = { account: { 'read:any': ['*'] } };
        helper_1.helper.expectACError(() => utils_1.utils.getRoleHierarchyOf(grants, ''));
    });
    test('#getFlatRoles()', () => {
        helper_1.helper.expectACError(() => utils_1.utils.getFlatRoles({}, ''));
    });
    test('#getNonExistentRoles()', () => {
        const grants = {
            admin: {
                account: { 'read:any': ['*'] },
            },
        };
        expect(utils_1.utils.getNonExistentRoles(grants, [])).toEqual([]);
        expect(utils_1.utils.getNonExistentRoles(grants, [''])).toEqual(['']);
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
        expect(utils_1.utils.getCrossExtendingRole(grants, 'admin', ['admin'])).toEqual(null);
        expect(utils_1.utils.getCrossExtendingRole(grants, 'admin', ['user'])).toEqual(null);
        helper_1.helper.expectACError(() => utils_1.utils.getCrossExtendingRole(grants, 'user', ['admin']));
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
        helper_1.helper.expectACError(() => utils_1.utils.extendRole(grants, 'nonexisting', 'user'));
        helper_1.helper.expectACError(() => utils_1.utils.extendRole(grants, 'admin', 'nonexisting'));
        helper_1.helper.expectACError(() => utils_1.utils.extendRole(grants, 'admin', 'editor'));
        helper_1.helper.expectACError(() => utils_1.utils.extendRole(grants, '$', 'user'));
        expect(() => utils_1.utils.extendRole(grants, 'admin', 'viewer')).not.toThrow();
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
        expect(utils_1.utils.getUnionAttrsOfRoles(grants, query)).toEqual([]);
        query.role = 'nonexisting';
        helper_1.helper.expectACError(() => utils_1.utils.getUnionAttrsOfRoles(grants, query));
    });
    test('#lockAC()', () => {
        const ac = new src_1.AccessControl();
        helper_1.helper.expectACError(() => utils_1.utils.lockAC(ac));
        ac._grants = null;
        helper_1.helper.expectACError(() => utils_1.utils.lockAC(ac));
    });
});
//# sourceMappingURL=utils.spec.js.map