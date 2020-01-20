import { AccessControl, AccessControlError, IQueryInfo } from '../src';
import * as utils from '../src/utils';
// test helper
import { helper } from './helper';

describe('Test Suite: AccessControl', () => {
  // grant list fetched from DB (to be converted to a valid grants object)
  const grantList: any[] = [
    { role: 'admin', resource: 'video', action: 'create:any', attributes: ['*'] },
    { role: 'admin', resource: 'video', action: 'read:any', attributes: ['*'] },
    { role: 'admin', resource: 'video', action: 'update:any', attributes: ['*'] },
    { role: 'admin', resource: 'video', action: 'delete:any', attributes: ['*'] },

    // comma-separated attrs
    { role: 'user', resource: 'video', action: 'create:own', attributes: '*, !id' },
    // semi-colon separated attrs
    { role: 'user', resource: 'video', action: 'read:any', attributes: '*; !id' },
    // Array attrs
    { role: 'user', resource: 'video', action: 'update:own', attributes: ['*', '!id'] },
    { role: 'user', resource: 'video', action: 'delete:own', attributes: ['*'] },
  ];

  // valid grants object
  const grantsObject: any = {
    admin: {
      video: {
        'create:any': ['*'],
        'read:any': ['*'],
        'update:any': ['*'],
        'delete:any': ['*'],
      },
    },
    user: {
      video: {
        'create:own': ['*'],
        'read:own': ['*'],
        'update:own': ['*'],
        'delete:own': ['*'],
      },
    },
  };

  test('throw on invalid grants object', () => {
    const accessControl = new AccessControl();

    // `undefined` does/should not throw due to default value
    let invalid: any = [null, undefined, true, false, '', NaN, new Date(), () => {}];
    invalid.forEach((o: any) => {
      helper.expectAccessControlError(() => new AccessControl(o));
      helper.expectAccessControlError(() => accessControl.setGrants(o));
    });

    // omitting is allowed (results in empty grants object: {})
    expect(() => new AccessControl()).not.toThrow();
    // empty object is allowed
    expect(() => new AccessControl({})).not.toThrow();
    expect(new AccessControl({}).getGrants()).toEqual({});
    // explicit undefined is not allowed
    helper.expectAccessControlError(() => new AccessControl(undefined));

    // ----------------------------
    // Initial Grants as an Object
    // ----------------------------

    // reserved keywords
    helper.expectAccessControlError(() => accessControl.setGrants({ $: {} }));
    helper.expectAccessControlError(() => accessControl.setGrants({ $extend: {} }));
    // if $extend is set to an array of strings or empty array, it's valid
    // (contains inherited roles)
    expect(() =>
      accessControl.setGrants({
        admin: { $extend: [] },
      }),
    ).not.toThrow();
    // empty string in the $extend array is not allowed
    helper.expectAccessControlError(() =>
      accessControl.setGrants({
        admin: { $extend: [''] },
      }),
    );

    // role definition must be an object
    invalid = [[], undefined, null, true, new Date()];
    invalid.forEach((_: any) => {
      helper.expectAccessControlError(() => accessControl.setGrants({ role: invalid }));
    });
    // resource definition must be an object
    invalid.forEach((_: any) => {
      helper.expectAccessControlError(() =>
        accessControl.setGrants({
          role: { resource: invalid },
        }),
      );
    });
    // actions should be one of Action enumeration (with or without possession)
    helper.expectAccessControlError(() =>
      accessControl.setGrants({
        role: { resource: { invalid: [] } },
      }),
    );
    helper.expectAccessControlError(() =>
      accessControl.setGrants({
        role: { resource: { 'remove:any': [] } },
      }),
    );
    // missing colon
    helper.expectAccessControlError(() =>
      accessControl.setGrants({
        role: { resource: { createany: [] } },
      }),
    );
    // action/possession is ok but value is invalid
    invalid = [undefined, null, true, new Date(), {}];
    invalid.forEach((_: any) => {
      helper.expectAccessControlError(() =>
        accessControl.setGrants({
          role: {
            resource: { 'create:any': invalid },
          },
        }),
      );
    });

    // ----------------------------
    // Initial Grants as an Array
    // ----------------------------

    // empty array is allowed. a flat list will be converted to inner grants object.
    // empty array results in {}.
    expect(() => new AccessControl([])).not.toThrow();
    expect(new AccessControl([]).getGrants()).toEqual({});
    // array should be an array of objects
    helper.expectAccessControlError(() => accessControl.setGrants([[]]));
    // no empty grant items
    helper.expectAccessControlError(() => accessControl.setGrants([{}]));
    // e.g. $extend is not allowed for role or resource names. it's a reserved keyword.
    utils.RESERVED_KEYWORDS.forEach((name: string) => {
      helper.expectAccessControlError(() =>
        accessControl.setGrants([
          {
            role: name,
            resource: 'video',
            action: 'create:any',
          },
        ]),
      );
      helper.expectAccessControlError(() =>
        accessControl.setGrants([
          {
            role: 'admin',
            resource: name,
            action: 'create:any',
          },
        ]),
      );
      helper.expectAccessControlError(() =>
        accessControl.setGrants([
          {
            role: 'admin',
            resource: 'video',
            action: name,
          },
        ]),
      );
    });

    // attributes property can be omitted
    expect(() =>
      accessControl.setGrants([
        {
          role: 'admin',
          resource: 'video',
          action: 'create:any',
        },
      ]),
    ).not.toThrow();
    // role, resource or action properties cannot be omitted
    helper.expectAccessControlError(() =>
      accessControl.setGrants([{ resource: 'video', action: 'create:any' }]),
    );
    helper.expectAccessControlError(() =>
      accessControl.setGrants([{ role: 'admin', resource: 'video' }]),
    );
    helper.expectAccessControlError(() =>
      accessControl.setGrants([{ role: 'admin', action: 'create:any' }]),
    );
  });

  test('construct with grants array or object, output a grants object', () => {
    let accessControl = new AccessControl(grantList);
    let grants = accessControl.getGrants();
    expect(utils.type(grants)).toEqual('object');
    expect(utils.type(grants.admin)).toEqual('object');
    expect(grants.admin.video['create:any']).toEqual(expect.any(Array));

    accessControl = new AccessControl(grantsObject);
    grants = accessControl.getGrants();
    expect(utils.type(grants)).toEqual('object');
    expect(utils.type(grants.admin)).toEqual('object');
    expect(grants.admin.video['create:any']).toEqual(expect.any(Array));

    grants = {
      user: {
        account: {
          'read:own': ['*'],
        },
      },
      admin: {
        $extend: ['user'],
      },
    };
    accessControl = new AccessControl(grants);
    expect(utils.type(grants)).toEqual('object');
    expect(accessControl.can('user').readOwn('account').granted).toBe(true);
    expect(accessControl.can('user').readOwn('account').attributes).toEqual(['*']);
    expect(accessControl.can('admin').readOwn('account').granted).toBe(true);
    expect(accessControl.can('admin').readOwn('account').attributes).toEqual(['*']);
  });

  test('reset grants with #reset() only', () => {
    const accessControl = new AccessControl(grantsObject);
    expect(accessControl.getRoles().length).toBeGreaterThan(0); // make sure not empty
    helper.expectAccessControlError(() => (accessControl as any).setGrants());
    helper.expectAccessControlError(() => accessControl.setGrants(null));
    helper.expectAccessControlError(() => accessControl.setGrants(undefined));
    expect(accessControl.reset().getGrants()).toEqual({});
    expect(accessControl.setGrants({}).getGrants()).toEqual({});
  });

  test('add grants from flat list (db), check/remove roles and resources', () => {
    const accessControl = new AccessControl();

    expect((accessControl as any).hasRole()).toEqual(false);
    expect(accessControl.hasRole(undefined)).toEqual(false);
    expect(accessControl.hasRole('')).toEqual(false);

    expect((accessControl as any).hasResource()).toEqual(false);
    expect(accessControl.hasResource(undefined)).toEqual(false);
    expect(accessControl.hasResource('')).toEqual(false);

    accessControl.setGrants(grantList.concat());

    // comma/semi-colon separated should be turned into string arrays
    const attrs1 = accessControl.can('user').createOwn('video').attributes;
    const attrs2 = accessControl.can('user').readAny('video').attributes;
    expect(attrs1.length).toEqual(1);
    expect(attrs2.length).toEqual(1);

    // check roles & resources
    expect(accessControl.getRoles().length).toEqual(2);
    expect(accessControl.getResources().length).toEqual(1);
    expect(accessControl.hasRole('admin')).toEqual(true);
    expect(accessControl.hasRole('user')).toEqual(true);
    expect(accessControl.hasRole(['user', 'admin'])).toEqual(true);
    expect(accessControl.hasRole(['user', 'moderator'])).toEqual(false);
    expect(accessControl.hasRole('moderator')).toEqual(false);
    expect(accessControl.hasResource('video')).toEqual(true);
    expect(accessControl.hasResource(['video', 'photo'])).toEqual(false);
    accessControl.grant('admin').create('image');
    expect(accessControl.hasResource(['video', 'image'])).toEqual(true);
  });

  test('grant/deny access and check permissions', () => {
    const accessControl = new AccessControl();
    const attrs = ['*'];

    accessControl.grant('user').createAny('photo', attrs);
    expect(accessControl.getGrants().user.photo['create:any']).toEqual(attrs);
    expect(accessControl.can('user').createAny('photo').attributes).toEqual(attrs);

    accessControl.deny('user').createAny('photo', attrs); // <- denied even with attrs
    expect(accessControl.can('user').createAny('photo').granted).toEqual(false);
    expect(accessControl.can('user').createAny('photo').attributes).toEqual([]);

    accessControl.grant('user').createOwn('photo', attrs);
    expect(accessControl.getGrants().user.photo['create:own']).toEqual(attrs);
    expect(accessControl.can('user').createOwn('photo').attributes).toEqual(attrs);

    // grant multiple roles the same permission for the same resource
    accessControl.grant(['user', 'admin']).readAny('photo', attrs);
    expect(accessControl.can('user').readAny('photo').granted).toEqual(true);
    expect(accessControl.can('admin').readAny('photo').granted).toEqual(true);
    // deny multiple roles (comma-separated) the same permission for the same resource
    accessControl.deny('user, admin').readAny('photo');
    expect(accessControl.can('user').readAny('photo').granted).toEqual(false);
    expect(accessControl.can('admin').readAny('photo').granted).toEqual(false);

    accessControl.grant('user').updateAny('photo', attrs);
    expect(accessControl.getGrants().user.photo['update:any']).toEqual(attrs);
    expect(accessControl.can('user').updateAny('photo').attributes).toEqual(attrs);

    accessControl.grant('user').updateOwn('photo', attrs);
    expect(accessControl.getGrants().user.photo['update:own']).toEqual(attrs);
    expect(accessControl.can('user').updateOwn('photo').attributes).toEqual(attrs);

    accessControl.grant('user').deleteAny('photo', attrs);
    expect(accessControl.getGrants().user.photo['delete:any']).toEqual(attrs);
    expect(accessControl.can('user').deleteAny('photo').attributes).toEqual(attrs);

    accessControl.grant('user').deleteOwn('photo', attrs);
    expect(accessControl.getGrants().user.photo['delete:own']).toEqual(attrs);
    expect(accessControl.can('user').deleteOwn('photo').attributes).toEqual(attrs);
  });

  test('explicit undefined', () => {
    const accessControl = new AccessControl();
    helper.expectAccessControlError(() => (accessControl as any).grant(undefined));
    helper.expectAccessControlError(() => (accessControl as any).deny(undefined));
    helper.expectAccessControlError(() => (accessControl as any).can(undefined));
    helper.expectAccessControlError(() => (accessControl as any).permission(undefined));
  });

  test('aliases: #allow(), #reject(), #query()', () => {
    const accessControl = new AccessControl();

    accessControl.grant(['user', 'admin']).createAny('photo');
    expect(accessControl.can('user').createAny('photo').granted).toBe(true);
  });

  test('#permission()', () => {
    const accessControl = new AccessControl(grantsObject);
    expect(accessControl.can('admin').createAny('video').granted).toBe(true);

    const queryInfo: IQueryInfo = {
      role: 'admin',
      resource: 'video',
      action: 'create:any',
    };
    expect(accessControl.permission(queryInfo).granted).toBe(true);
    queryInfo.role = 'user';
    expect(accessControl.permission(queryInfo).granted).toBe(false);
    queryInfo.action = 'create:own';
    expect(accessControl.permission(queryInfo).granted).toBe(true);
  });

  test('chain grant methods and check permissions', () => {
    const accessControl = new AccessControl();
    const attrs = ['*'];

    accessControl
      .grant('superadmin')
      .createAny('profile', attrs)
      .readAny('profile', attrs)
      .createAny('video', []) // no attributes allowed
      .createAny('photo'); // all attributes allowed

    expect(accessControl.can('superadmin').createAny('profile').granted).toEqual(true);
    expect(accessControl.can('superadmin').readAny('profile').granted).toEqual(true);
    expect(accessControl.can('superadmin').createAny('video').granted).toEqual(false);
    expect(accessControl.can('superadmin').createAny('photo').granted).toEqual(true);
  });

  test('grant/deny access via object and check permissions', () => {
    const accessControl = new AccessControl();
    const attrs = ['*'];

    const o1 = {
      role: 'moderator',
      resource: 'post',
      action: 'create:any', // action:possession
      attributes: ['*'], // grant only
    };
    const o2 = {
      role: 'moderator',
      resource: 'news',
      action: 'read', // separate action
      possession: 'own', // separate possession
      attributes: ['*'], // grant only
    };
    const o3 = {
      role: 'moderator',
      resource: 'book',
      // no action/possession set
      attributes: ['*'], // grant only
    };

    accessControl.grant(o1).grant(o2);
    accessControl.grant(o3).updateAny();

    expect(accessControl.can('moderator').createAny('post').granted).toEqual(true);
    expect(accessControl.can('moderator').readOwn('news').granted).toEqual(true);
    expect(accessControl.can('moderator').updateAny('book').granted).toEqual(true);

    accessControl.deny(o1).deny(o2);
    accessControl.deny(o3).updateAny();

    expect(accessControl.can('moderator').createAny('post').granted).toEqual(false);
    expect(accessControl.can('moderator').readOwn('news').granted).toEqual(false);
    expect(accessControl.can('moderator').updateAny('book').granted).toEqual(false);

    // should overwrite already defined action/possession in o1 object
    accessControl.grant(o1).readOwn();
    expect(accessControl.can('moderator').readOwn('post').granted).toEqual(true);
    accessControl.deny(o1).readOwn();
    expect(accessControl.can('moderator').readOwn('post').granted).toEqual(false);

    // non-set action (update:own)
    expect(accessControl.can('moderator').updateOwn('news').granted).toEqual(false);
    // non-existent resource
    expect(accessControl.can('moderator').createAny('foo').granted).toEqual(false);
  });

  test('grant/deny access (variation, chained)', () => {
    const accessControl = new AccessControl();
    accessControl.setGrants(grantsObject);

    expect(accessControl.can('admin').createAny('video').granted).toEqual(true);
    accessControl.deny('admin').create('video');
    expect(accessControl.can('admin').createAny('video').granted).toEqual(false);

    accessControl.grant('foo').createOwn('bar');
    expect(accessControl.can('foo').createAny('bar').granted).toEqual(false);
    expect(accessControl.can('foo').createOwn('bar').granted).toEqual(true);

    // no attributes, actually denied instead of granted
    accessControl.grant('foo').create('baz', []);
    expect(accessControl.can('foo').create('baz').granted).toEqual(false);

    accessControl
      .grant('qux')
      .createOwn('resource1')
      .updateOwn('resource2')
      .readAny('resource1')
      .deleteAny('resource1', []);
    expect(accessControl.can('qux').createOwn('resource1').granted).toEqual(true);
    expect(accessControl.can('qux').updateOwn('resource2').granted).toEqual(true);
    expect(accessControl.can('qux').readAny('resource1').granted).toEqual(true);
    expect(accessControl.can('qux').deleteAny('resource1').granted).toEqual(false);

    accessControl
      .deny('qux')
      .createOwn('resource1')
      .updateOwn('resource2')
      .readAny('resource1')
      .deleteAny('resource1', []);
    expect(accessControl.can('qux').createOwn('resource1').granted).toEqual(false);
    expect(accessControl.can('qux').updateOwn('resource2').granted).toEqual(false);
    expect(accessControl.can('qux').readAny('resource1').granted).toEqual(false);
    expect(accessControl.can('qux').deleteAny('resource1').granted).toEqual(false);

    accessControl
      .grant('editor')
      .resource('file1')
      .updateAny();
    accessControl
      .grant()
      .role('editor')
      .updateAny('file2');
    accessControl
      .grant()
      .role('editor')
      .resource('file3')
      .updateAny();
    expect(accessControl.can('editor').updateAny('file1').granted).toEqual(true);
    expect(accessControl.can('editor').updateAny('file2').granted).toEqual(true);
    expect(accessControl.can('editor').updateAny('file3').granted).toEqual(true);

    accessControl
      .deny('editor')
      .resource('file1')
      .updateAny();
    accessControl
      .deny()
      .role('editor')
      .updateAny('file2');
    accessControl
      .deny()
      .role('editor')
      .resource('file3')
      .updateAny();
    expect(accessControl.can('editor').updateAny('file1').granted).toEqual(false);
    expect(accessControl.can('editor').updateAny('file2').granted).toEqual(false);
    expect(accessControl.can('editor').updateAny('file3').granted).toEqual(false);

    accessControl
      .grant('editor')
      .resource('fileX')
      .readAny()
      .createOwn()
      .resource('fileY')
      .updateOwn()
      .deleteOwn();
    expect(accessControl.can('editor').readAny('fileX').granted).toEqual(true);
    expect(accessControl.can('editor').createOwn('fileX').granted).toEqual(true);
    expect(accessControl.can('editor').updateOwn('fileY').granted).toEqual(true);
    expect(accessControl.can('editor').deleteOwn('fileY').granted).toEqual(true);

    accessControl
      .deny('editor')
      .resource('fileX')
      .readAny()
      .createOwn()
      .resource('fileY')
      .updateOwn()
      .deleteOwn();
    expect(accessControl.can('editor').readAny('fileX').granted).toEqual(false);
    expect(accessControl.can('editor').createOwn('fileX').granted).toEqual(false);
    expect(accessControl.can('editor').updateOwn('fileY').granted).toEqual(false);
    expect(accessControl.can('editor').deleteOwn('fileY').granted).toEqual(false);
  });

  test('switch-chain grant/deny roles', () => {
    const accessControl = new AccessControl();
    accessControl
      .grant('r1')
      .createOwn('a')
      .grant('r2')
      .createOwn('b')
      .readAny('b')
      .deny('r1')
      .deleteAny('b')
      .grant('r1')
      .updateAny('c')
      .deny('r2')
      .readAny('c');

    expect(accessControl.can('r1').createOwn('a').granted).toEqual(true);
    expect(accessControl.can('r1').deleteAny('b').granted).toEqual(false);
    expect(accessControl.can('r1').updateAny('c').granted).toEqual(true);
    expect(accessControl.can('r2').createOwn('b').granted).toEqual(true);
    expect(accessControl.can('r2').readAny('b').granted).toEqual(true);
    expect(accessControl.can('r2').readAny('c').granted).toEqual(false);
  });

  test('Access#deny() should set attributes to []', () => {
    const accessControl = new AccessControl();
    accessControl.deny('user').createAny('book', ['*']);
    expect(accessControl.getGrants().user.book['create:any']).toEqual([]);
  });

  test('grant comma/semi-colon separated roles', () => {
    const accessControl = new AccessControl();
    // also supporting comma/semi-colon separated roles
    accessControl.grant('role2; role3, editor; viewer, agent').createOwn('book');
    expect(accessControl.hasRole('role3')).toEqual(true);
    expect(accessControl.hasRole('editor')).toEqual(true);
    expect(accessControl.hasRole('agent')).toEqual(true);
  });

  test('Permission#roles, Permission#resource', () => {
    const accessControl = new AccessControl();
    // also supporting comma/semi-colon separated roles
    accessControl.grant('foo, bar').createOwn('baz');
    expect(accessControl.can('bar').createAny('baz').granted).toEqual(false);
    expect(accessControl.can('bar').createOwn('baz').granted).toEqual(true);
    // returned permission should provide queried role(s) as array
    expect(accessControl.can('foo').create('baz').roles).toContain('foo');
    // returned permission should provide queried resource
    expect(accessControl.can('foo').create('baz').resource).toEqual('baz');
    // create is createAny. but above only returns the queried value, not the result.
  });

  test('Access#extend()', () => {
    const accessControl = new AccessControl();

    accessControl.grant('admin').createOwn('book');

    accessControl.grant('role2, role3, editor, viewer, agent').createOwn('book');

    accessControl.grant('admin').extend('editor');
    expect(accessControl.getGrants().admin.$extend).toEqual(['editor']);
    accessControl
      .grant('admin')
      .extend(['viewer', 'editor', 'agent'])
      .readAny('video');
    expect(accessControl.getGrants().admin.$extend).toContain('editor');
    expect(accessControl.getGrants().admin.$extend).toEqual(['editor', 'viewer', 'agent']);

    accessControl
      .grant(['editor', 'agent'])
      .extend(['role2', 'role3'])
      .updateOwn('photo');
    expect(accessControl.getGrants().editor.$extend).toEqual(['role2', 'role3']);
    expect(accessControl.getGrants().agent.$extend).toEqual(['role2', 'role3']);
  });

  test('extend before or after resource permissions are granted', () => {
    let accessControl = new AccessControl();

    function init() {
      accessControl = new AccessControl();
      // create the roles
      accessControl.grant(['user', 'admin']);
      expect(accessControl.getRoles().length).toEqual(2);
    }

    // case #1
    init();
    accessControl
      .grant('admin')
      .extend('user') // assuming user role already exists
      .grant('user')
      .createOwn('video');
    expect(accessControl.can('admin').createOwn('video').granted).toEqual(true);

    // case #2
    init();
    accessControl
      .grant('user')
      .createOwn('video')
      .grant('admin')
      .extend('user');
    expect(accessControl.can('admin').createOwn('video').granted).toEqual(true);
  });

  test('extend multi-level (deep) roles', () => {
    const accessControl = new AccessControl();
    accessControl.grant('viewer').readAny('devices');
    accessControl
      .grant('ops')
      .extend('viewer')
      .updateAny('devices', ['*', '!id']);
    accessControl
      .grant('admin')
      .extend('ops')
      .deleteAny('devices');
    accessControl
      .grant('superadmin')
      .extend(['admin', 'ops'])
      .createAny('devices');

    expect(accessControl.can('ops').readAny('devices').granted).toEqual(true);
    expect(accessControl.can('admin').readAny('devices').granted).toEqual(true);
    expect(accessControl.can('admin').updateAny('devices').granted).toEqual(true);
    expect(accessControl.can('superadmin').readAny('devices').granted).toEqual(true);

    expect(accessControl.can('superadmin').updateAny('devices').attributes).toEqual(['*']);
    accessControl.grant('superadmin').updateAny('devices', ['*']);
    expect(accessControl.can('superadmin').updateAny('devices').attributes).toEqual(['*']);
  });

  test('throw if target role or inherited role does not exit', () => {
    const accessControl = new AccessControl();
    helper.expectAccessControlError(() => accessControl.grant().createOwn());
    accessControl.setGrants(grantsObject);
    helper.expectAccessControlError(
      () => accessControl.can('invalid-role').createOwn('video'),
      'Role not found',
    );
    helper.expectAccessControlError(() => accessControl.grant('user').extend('invalid-role'));
    helper.expectAccessControlError(() =>
      accessControl.grant('user').extend(['invalid1', 'invalid2']),
    );
  });

  test('throw on invalid or reserved names', () => {
    const accessControl = new AccessControl();
    utils.RESERVED_KEYWORDS.forEach((name: string) => {
      helper.expectAccessControlError(() => accessControl.grant(name));
      helper.expectAccessControlError(() => accessControl.deny(name));
      helper.expectAccessControlError(() => accessControl.grant().role(name));
      helper.expectAccessControlError(() => accessControl.grant('role').resource(name));
    });
    expect(() => accessControl.grant()).not.toThrow(); // omitted
    helper.expectAccessControlError(() => accessControl.grant(undefined)); // explicit undefined
    helper.expectAccessControlError(() => accessControl.grant(''));
    helper.expectAccessControlError(() => (accessControl as any).grant(1));
    helper.expectAccessControlError(() => (accessControl as any).grant(true));
    helper.expectAccessControlError(() => (accessControl as any).grant(false));
    helper.expectAccessControlError(() => (accessControl as any).grant([]));
    helper.expectAccessControlError(() => (accessControl as any).grant({}));
    helper.expectAccessControlError(() => new AccessControl({ $: [] }));
    helper.expectAccessControlError(() => new AccessControl({ $extend: {} }));
  });

  test('init with grants object with $extend (issue #22)', () => {
    const grants = {
      viewer: {
        account: {
          'read:own': ['*'],
        },
      },
      user: {
        $extend: ['viewer'],
        account: {
          'update:own': ['*'],
        },
      },
      admin: {
        $extend: ['user'],
        account: {
          'create:any': ['*'],
          'delete:any': ['*'],
        },
      },
    };
    expect(() => new AccessControl(grants)).not.toThrow();
    const accessControl = new AccessControl();
    expect(() => accessControl.setGrants(grants)).not.toThrow();
    // store grants (1) to a constant.
    const grants1 = accessControl.getGrants();
    // ensure to reset grants
    accessControl.reset();
    expect(accessControl.getGrants()).toEqual({});
    // now build the same grants via chained methods...
    accessControl
      .grant('viewer')
      .readOwn('account')
      .grant('user')
      .extend('viewer')
      .updateOwn('account')
      .grant('admin')
      .extend('user')
      .create('account')
      .delete('account');
    const grants2 = accessControl.getGrants();
    // and compare...
    expect(grants1).toEqual(grants2);
  });

  test('throw if a role attempts to extend itself', () => {
    let accessControl = new AccessControl();
    helper.expectAccessControlError(() => accessControl.grant('user').extend('user'));

    const grants = { user: { $extend: ['user'] } };
    helper.expectAccessControlError(() => new AccessControl(grants));
    accessControl = new AccessControl();
    helper.expectAccessControlError(() => accessControl.setGrants(grants));
  });

  test('throw on cross-role inheritance', () => {
    // test with chained methods
    let accessControl = new AccessControl();
    accessControl.grant(['user', 'admin']).createOwn('video');
    // make sure roles are created
    expect(accessControl.getRoles().length).toEqual(2);

    // direct cross-inheritance test
    accessControl.grant('admin').extend('user');
    helper.expectAccessControlError(() => accessControl.grant('user').extend('admin'));

    // deeper cross-inheritance test
    accessControl.grant(['editor', 'viewer', 'sa']).createOwn('image');
    accessControl.grant('sa').extend('editor');
    accessControl.grant('editor').extend('viewer');
    helper.expectAccessControlError(() => accessControl.grant('viewer').extend('sa'));

    // test with initial grants object

    // direct cross-inheritance test
    // user » admin » user
    let grants: any = {
      user: {
        $extend: ['admin'],
      },
      admin: {
        $extend: ['user'],
      },
    };
    helper.expectAccessControlError(() => new AccessControl(grants));
    accessControl = new AccessControl();
    helper.expectAccessControlError(() => accessControl.setGrants(grants));

    // deeper cross-inheritance test
    // user » sa » editor » viewer » user
    grants = {
      user: {
        $extend: ['sa'],
      },
      sa: {
        $extend: ['editor'],
      },
      editor: {
        $extend: ['viewer'],
      },
      viewer: {
        $extend: ['user'],
      },
    };
    helper.expectAccessControlError(() => new AccessControl(grants));
    accessControl = new AccessControl();
    helper.expectAccessControlError(() => accessControl.setGrants(grants));

    // viewer » editor » user » sa » editor
    grants = {
      user: {
        $extend: ['sa'],
      },
      sa: {
        $extend: ['editor'],
      },
      editor: {
        $extend: ['user'],
      },
      viewer: {
        $extend: ['editor'],
      },
    };
    helper.expectAccessControlError(() => new AccessControl(grants));
    accessControl = new AccessControl();
    helper.expectAccessControlError(() => accessControl.setGrants(grants));
  });

  test('throw if grant or deny objects are invalid', () => {
    const accessControl = new AccessControl();
    let o: any;

    o = {
      role: '', // invalid role, should be non-empty string or array
      resource: 'post',
      action: 'create:any',
      attributes: ['*'], // grant only
    };
    expect(() => accessControl.grant(o)).toThrow();
    expect(() => accessControl.deny(o)).toThrow();

    o = {
      role: 'moderator',
      resource: null, // invalid resource, should be non-empty string
      action: 'create:any',
      attributes: ['*'], // grant only
    };
    expect(() => accessControl.grant(o)).toThrow();
    expect(() => accessControl.deny(o)).toThrow();

    o = {
      role: 'admin',
      resource: 'post',
      action: 'put:any', // invalid action, should be create|read|update|delete
      attributes: ['*'], // grant only
    };
    expect(() => accessControl.grant(o)).toThrow();
    expect(() => accessControl.deny(o)).toThrow();

    o = {
      role: 'admin',
      resource: 'post',
      action: null, // invalid action, should be create|read|update|delete
      attributes: ['*'], // grant only
    };
    expect(() => accessControl.grant(o)).toThrow();
    expect(() => accessControl.deny(o)).toThrow();

    o = {
      role: 'admin',
      resource: 'post',
      action: 'create:all', // invalid possession, should be any|own or omitted
      attributes: ['*'], // grant only
    };
    expect(() => accessControl.grant(o)).toThrow();
    expect(() => accessControl.deny(o)).toThrow();

    o = {
      role: 'admin2',
      resource: 'post',
      action: 'create', // possession omitted, will be set to any
      attributes: ['*'], // grant only
    };
    expect(() => accessControl.grant(o)).not.toThrow();
    expect(accessControl.can('admin2').createAny('post').granted).toEqual(true);
    // possession "any" will also return granted=true for "own"
    expect(accessControl.can('admin2').createOwn('post').granted).toEqual(true);
    expect(() => accessControl.deny(o)).not.toThrow();
  });

  test('Check with multiple roles changes grant list (issue #2)', () => {
    const accessControl = new AccessControl();
    accessControl
      .grant('admin')
      .updateAny('video')
      .grant(['user', 'admin'])
      .updateOwn('video');

    // Admin can update any video
    expect(accessControl.can(['admin']).updateAny('video').granted).toEqual(true);

    // This check actually changes the underlying grants
    accessControl.can(['user', 'admin']).updateOwn('video');

    // Admin can update any or own video
    expect(accessControl.can(['admin']).updateAny('video').granted).toEqual(true);
    expect(accessControl.can(['admin']).updateOwn('video').granted).toEqual(true);
  });

  test('grant/deny multiple roles and multiple resources', () => {
    const accessControl = new AccessControl();

    accessControl.grant('admin, user').createAny('profile, video');
    expect(accessControl.can('admin').createAny('profile').granted).toEqual(true);
    expect(accessControl.can('admin').createAny('video').granted).toEqual(true);
    expect(accessControl.can('user').createAny('profile').granted).toEqual(true);
    expect(accessControl.can('user').createAny('video').granted).toEqual(true);

    accessControl.grant('admin, user').createAny('profile, video', '*,!id');
    expect(accessControl.can('admin').createAny('profile').attributes).toEqual(['*']);
    expect(accessControl.can('admin').createAny('video').attributes).toEqual(['*']);
    expect(accessControl.can('user').createAny('profile').attributes).toEqual(['*']);
    expect(accessControl.can('user').createAny('video').attributes).toEqual(['*']);

    accessControl.deny('admin, user').readAny('photo, book', '*,!id');
    expect(accessControl.can('admin').readAny('photo').attributes).toEqual([]);
    expect(accessControl.can('admin').readAny('book').attributes).toEqual([]);
    expect(accessControl.can('user').readAny('photo').attributes).toEqual([]);
    expect(accessControl.can('user').readAny('book').attributes).toEqual([]);

    expect(accessControl.can('user').createAny('non-existent').granted).toEqual(false);
  });

  test('union granted attributes for extended roles', () => {
    const accessControl = new AccessControl();
    const restrictedAttrs = ['*', '!pwd', '!id'];
    // grant user restricted attrs
    accessControl
      .grant('user')
      .updateAny('video', restrictedAttrs)
      // extend admin with user as is (same attributes)
      .grant('admin')
      .extend('user');
    // admin should have the same restricted attributes
    expect(accessControl.can('admin').updateAny('video').attributes).toEqual(['*']);
    // grant admin unrestricted attrs (['*'])
    accessControl.grant('admin').updateAny('video');
    // unioned attributes should be ['*']
    expect(accessControl.can('admin').updateAny('video').attributes).toEqual(['*']);

    accessControl
      .grant('editor')
      .updateAny('video', ['*', '!pwd', '!id'])
      .extend('user');
    // '!pwd' exists in both attribute lists, so it should exist in union.
    expect(accessControl.can('editor').updateAny('video').attributes).toEqual(['*']);

    accessControl
      .grant('role1')
      .createOwn('photo', ['image', 'name'])
      .grant('role2')
      .createOwn('photo', ['name', '!location']) // '!location' is redundant here
      .grant('role3')
      .createOwn('photo', ['*', '!location'])
      .grant('role4')
      .extend(['role1', 'role2'])
      .grant('role5')
      .extend(['role1', 'role2', 'role3']);
    expect(accessControl.can('role5').createOwn('photo').attributes).toEqual(['*']);
  });

  test('Action / Possession enumerations', () => {
    expect(AccessControl.Action).toEqual(expect.any(Object));
    expect(AccessControl.Possession).toEqual(expect.any(Object));
    expect(AccessControl.Possession.ANY).toBe('any');
    expect(AccessControl.Possession.OWN).toBe('own');
  });

  test('AccessControlError', () => {
    helper.expectAccessControlError(() => {
      throw new AccessControl.Error();
    });
    helper.expectAccessControlError(() => {
      throw new AccessControlError();
    });
    expect(new AccessControlError().message).toEqual('');
  });
});
