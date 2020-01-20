import { IQueryInfo } from '../src';
import * as utils from '../src/utils';

import { helper } from './helper';

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
    expect(utils.isFilledStringArray([])).toBe(true); // allowed
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
    const original: number[] = [1, 2, 3];
    let items: number[] = [];
    utils.each(original, (item: number) => items.push(item));
    expect(items).toEqual(original);

    items = [];

    // break out early by returning false

    utils.each(original, (item: number) => {
      items.push(item);
      return item < 2;
    });
    expect(items).toEqual([1, 2]);

    const o = { x: 0, y: 1, z: 2 };
    const d = {} as any;
    utils.eachKey(o, (key: string, index: number) => {
      d[key] = index;
    });
    expect(d).toEqual(o);
  });
});

describe('Test Suite: utils (core)', () => {
  test('#validName(), #hasValidNames()', () => {
    let valid: any = 'someName';
    expect(utils.validName(valid)).toBe(true);
    expect(utils.validName(valid, false)).toBe(true);
    expect(utils.validName(valid, false)).toBe(true);

    let invalid: any = utils.RESERVED_KEYWORDS[0];
    helper.expectAccessControlError(() => utils.validName(invalid));
    helper.expectAccessControlError(() => utils.validName(invalid, true));
    expect(utils.validName(invalid, false)).toBe(false);
    expect(utils.validName('', false)).toBe(false);
    expect((utils as any).validName(1, false)).toBe(false);
    expect((utils as any).validName(null, false)).toBe(false);
    expect((utils as any).validName(true, false)).toBe(false);

    valid = ['valid', 'name'];
    expect(utils.hasValidNames(valid)).toBe(true);
    expect(utils.hasValidNames(valid, false)).toBe(true);
    expect(utils.hasValidNames(valid, false)).toBe(true);

    invalid = ['valid', utils.RESERVED_KEYWORDS[utils.RESERVED_KEYWORDS.length - 1]];
    helper.expectAccessControlError(() => utils.hasValidNames(invalid));
    helper.expectAccessControlError(() => utils.hasValidNames(invalid, true));
    expect(utils.hasValidNames(invalid, false)).toBe(false);
  });

  test('#validResourceObject()', () => {
    helper.expectAccessControlError(() => utils.validResourceObject(null));
    helper.expectAccessControlError(() => utils.validResourceObject(null));
    expect(utils.validResourceObject({ create: [] })).toBe(true);
    expect(utils.validResourceObject({ 'create:any': ['*', '!id'] })).toBe(true);
    expect(utils.validResourceObject({ 'update:own': ['*'] })).toBe(true);

    helper.expectAccessControlError(() => utils.validResourceObject({ invalid: [], create: [] }));
    helper.expectAccessControlError(() => utils.validResourceObject({ 'invalid:any': [] }));
    helper.expectAccessControlError(() => utils.validResourceObject({ 'invalid:any': [''] }));
    helper.expectAccessControlError(() =>
      utils.validResourceObject({ 'read:own': ['*'], 'invalid:own': [] }),
    );

    helper.expectAccessControlError(() => utils.validResourceObject({ 'create:all': [] }));
    helper.expectAccessControlError(() => utils.validResourceObject({ 'create:all': [] }));

    helper.expectAccessControlError(() => utils.validResourceObject({ create: null }));
    helper.expectAccessControlError(() => utils.validResourceObject({ 'create:own': undefined }));
    helper.expectAccessControlError(() =>
      utils.validResourceObject({ 'read:own': [], 'create:any': [''] }),
    );
    helper.expectAccessControlError(() => utils.validResourceObject({ 'create:any': ['*', ''] }));
  });

  test('#validRoleObject()', () => {
    const grants: any = { admin: { account: { 'read:any': ['*'] } } };
    expect(utils.validRoleObject(grants, 'admin')).toBe(true);
    grants.admin = { account: ['*'] };
    helper.expectAccessControlError(() => utils.validRoleObject(grants, 'admin'));
    grants.admin = { account: { 'read:own': ['*'] } };
    expect(() => utils.validRoleObject(grants, 'admin')).not.toThrow();
    grants.admin = { account: { read: ['*'] } };
    expect(() => utils.validRoleObject(grants, 'admin')).not.toThrow();
    grants.admin = { account: { 'read:all': ['*'] } };
    helper.expectAccessControlError(() => utils.validRoleObject(grants, 'admin'));
    grants.admin = { $extend: ['*'] }; // cannot inherit non-existent role(s)
    helper.expectAccessControlError(() => utils.validRoleObject(grants, 'admin'));

    grants.user = { account: { 'read:own': ['*'] } };
    grants.admin = { $extend: ['user'] };
    expect(() => utils.validRoleObject(grants, 'admin')).not.toThrow();
    grants.admin = { $: { account: { 'read:own': ['*'] } } }; // $: reserved
    helper.expectAccessControlError(() => utils.validRoleObject(grants, 'admin'));
    grants.admin = { account: [] }; // invalid resource structure
    helper.expectAccessControlError(() => utils.validRoleObject(grants, 'admin'));
    grants.admin = { account: { 'read:own': [''] } }; // invalid resource structure
    helper.expectAccessControlError(() => utils.validRoleObject(grants, 'admin'));
    grants.admin = { account: null }; // invalid resource structure
    helper.expectAccessControlError(() => utils.validRoleObject(grants, 'admin'));
  });

  test('#normalizeQueryInfo(), #normalizeAccessInfo()', () => {
    helper.expectAccessControlError(() => (utils as any).normalizeQueryInfo({ role: 1 }));
    helper.expectAccessControlError(() => utils.normalizeQueryInfo({ role: [] }));
    helper.expectAccessControlError(() => utils.normalizeQueryInfo({ role: '' }));
    helper.expectAccessControlError(() => utils.normalizeQueryInfo({ role: 'sa', resource: '' }));
    helper.expectAccessControlError(() =>
      (utils as any).normalizeQueryInfo({ role: 'sa', resource: null }),
    );
    helper.expectAccessControlError(() =>
      (utils as any).normalizeQueryInfo({ role: 'sa', resource: [] }),
    );

    helper.expectAccessControlError(() => utils.normalizeAccessInfo({ role: [] }));
    helper.expectAccessControlError(() => utils.normalizeAccessInfo({ role: '' }));
    helper.expectAccessControlError(() => (utils as any).normalizeAccessInfo({ role: 1 }));
    helper.expectAccessControlError(() => utils.normalizeAccessInfo({ role: 'sa', resource: '' }));
    helper.expectAccessControlError(() =>
      (utils as any).normalizeAccessInfo({ role: 'sa', resource: null }),
    );
    helper.expectAccessControlError(() =>
      (utils as any).normalizeAccessInfo({ role: 'sa', resource: [] }),
    );
  });

  test('#getRoleHierarchyOf()', () => {
    const grants: any = {
      admin: {
        $extend: ['user'],
      },
    };
    helper.expectAccessControlError(() => utils.getRoleHierarchyOf(grants, 'admin'));
    grants.admin = { $extend: ['admin'] };
    helper.expectAccessControlError(() => utils.getRoleHierarchyOf(grants, 'admin'));

    grants.admin = { account: { 'read:any': ['*'] } };
    helper.expectAccessControlError(() => utils.getRoleHierarchyOf(grants, ''));
  });

  test('#getFlatRoles()', () => {
    helper.expectAccessControlError(() => utils.getFlatRoles({}, ''));
  });

  test('#getNonExistentRoles()', () => {
    const grants: any = {
      admin: {
        account: { 'read:any': ['*'] },
      },
    };
    expect(utils.getNonExistentRoles(grants, [])).toEqual([]);
    expect(utils.getNonExistentRoles(grants, [''])).toEqual(['']);
  });

  test('#getCrossExtendingRole()', () => {
    const grants: any = {
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
    helper.expectAccessControlError(() => utils.getCrossExtendingRole(grants, 'user', ['admin']));
  });

  test('#extendRole()', () => {
    const grants: any = {
      user: {},
      admin: {
        $extend: ['user', 'editor'],
      },
      editor: {
        $extend: ['admin'],
      },
      viewer: {},
    };
    helper.expectAccessControlError(() => utils.extendRole(grants, 'nonexisting', 'user'));
    helper.expectAccessControlError(() => utils.extendRole(grants, 'admin', 'nonexisting'));
    // cross
    helper.expectAccessControlError(() => utils.extendRole(grants, 'admin', 'editor'));
    // reserved keyword
    helper.expectAccessControlError(() => utils.extendRole(grants, '$', 'user'));
    expect(() => utils.extendRole(grants, 'admin', 'viewer')).not.toThrow();
  });

  test('#getUnionAttrsOfRoles()', () => {
    const grants: any = {
      user: {
        account: {
          'read:own': ['*'],
        },
      },
      admin: {
        $extend: ['user'],
      },
    };
    const query: IQueryInfo = {
      role: 'admin',
      resource: 'account',
      action: 'read',
    };
    expect(utils.getUnionAttrsOfRoles(grants, query)).toEqual([]);
    query.role = 'nonexisting';
    helper.expectAccessControlError(() => utils.getUnionAttrsOfRoles(grants, query));
  });
});
