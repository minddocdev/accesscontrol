"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const src_1 = require("../src");
const utils = require("../src/utils");
const helper_1 = require("./helper");
describe('Test Suite: AccessControl', () => {
    const grantList = [
        { role: 'admin', resource: 'video', action: 'create:any', attributes: ['*'] },
        { role: 'admin', resource: 'video', action: 'read:any', attributes: ['*'] },
        { role: 'admin', resource: 'video', action: 'update:any', attributes: ['*'] },
        { role: 'admin', resource: 'video', action: 'delete:any', attributes: ['*'] },
        { role: 'user', resource: 'video', action: 'create:own', attributes: '*, !id' },
        { role: 'user', resource: 'video', action: 'read:any', attributes: '*; !id' },
        { role: 'user', resource: 'video', action: 'update:own', attributes: ['*', '!id'] },
        { role: 'user', resource: 'video', action: 'delete:own', attributes: ['*'] },
    ];
    const grantsObject = {
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
        const accessControl = new src_1.AccessControl();
        let invalid = [null, undefined, true, false, '', NaN, new Date(), () => { }];
        invalid.forEach((o) => {
            helper_1.helper.expectAccessControlError(() => new src_1.AccessControl(o));
            helper_1.helper.expectAccessControlError(() => accessControl.setGrants(o));
        });
        expect(() => new src_1.AccessControl()).not.toThrow();
        expect(() => new src_1.AccessControl({})).not.toThrow();
        expect(new src_1.AccessControl({}).getGrants()).toEqual({});
        helper_1.helper.expectAccessControlError(() => new src_1.AccessControl(undefined));
        helper_1.helper.expectAccessControlError(() => accessControl.setGrants({ $: {} }));
        helper_1.helper.expectAccessControlError(() => accessControl.setGrants({ $extend: {} }));
        expect(() => accessControl.setGrants({
            admin: { $extend: [] },
        })).not.toThrow();
        helper_1.helper.expectAccessControlError(() => accessControl.setGrants({
            admin: { $extend: [''] },
        }));
        invalid = [[], undefined, null, true, new Date()];
        invalid.forEach((_) => {
            helper_1.helper.expectAccessControlError(() => accessControl.setGrants({ role: invalid }));
        });
        invalid.forEach((_) => {
            helper_1.helper.expectAccessControlError(() => accessControl.setGrants({
                role: { resource: invalid },
            }));
        });
        helper_1.helper.expectAccessControlError(() => accessControl.setGrants({
            role: { resource: { invalid: [] } },
        }));
        helper_1.helper.expectAccessControlError(() => accessControl.setGrants({
            role: { resource: { 'remove:any': [] } },
        }));
        helper_1.helper.expectAccessControlError(() => accessControl.setGrants({
            role: { resource: { createany: [] } },
        }));
        invalid = [undefined, null, true, new Date(), {}];
        invalid.forEach((_) => {
            helper_1.helper.expectAccessControlError(() => accessControl.setGrants({
                role: {
                    resource: { 'create:any': invalid },
                },
            }));
        });
        expect(() => new src_1.AccessControl([])).not.toThrow();
        expect(new src_1.AccessControl([]).getGrants()).toEqual({});
        helper_1.helper.expectAccessControlError(() => accessControl.setGrants([[]]));
        helper_1.helper.expectAccessControlError(() => accessControl.setGrants([{}]));
        utils.RESERVED_KEYWORDS.forEach((name) => {
            helper_1.helper.expectAccessControlError(() => accessControl.setGrants([
                {
                    role: name,
                    resource: 'video',
                    action: 'create:any',
                },
            ]));
            helper_1.helper.expectAccessControlError(() => accessControl.setGrants([
                {
                    role: 'admin',
                    resource: name,
                    action: 'create:any',
                },
            ]));
            helper_1.helper.expectAccessControlError(() => accessControl.setGrants([
                {
                    role: 'admin',
                    resource: 'video',
                    action: name,
                },
            ]));
        });
        expect(() => accessControl.setGrants([
            {
                role: 'admin',
                resource: 'video',
                action: 'create:any',
            },
        ])).not.toThrow();
        helper_1.helper.expectAccessControlError(() => accessControl.setGrants([{ resource: 'video', action: 'create:any' }]));
        helper_1.helper.expectAccessControlError(() => accessControl.setGrants([{ role: 'admin', resource: 'video' }]));
        helper_1.helper.expectAccessControlError(() => accessControl.setGrants([{ role: 'admin', action: 'create:any' }]));
    });
    test('construct with grants array or object, output a grants object', () => {
        let accessControl = new src_1.AccessControl(grantList);
        let grants = accessControl.getGrants();
        expect(utils.type(grants)).toEqual('object');
        expect(utils.type(grants.admin)).toEqual('object');
        expect(grants.admin.video['create:any']).toEqual(expect.any(Array));
        accessControl = new src_1.AccessControl(grantsObject);
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
        accessControl = new src_1.AccessControl(grants);
        expect(utils.type(grants)).toEqual('object');
        expect(accessControl.can('user').readOwn('account').granted).toBe(true);
        expect(accessControl.can('user').readOwn('account').attributes).toEqual(['*']);
        expect(accessControl.can('admin').readOwn('account').granted).toBe(true);
        expect(accessControl.can('admin').readOwn('account').attributes).toEqual(['*']);
    });
    test('reset grants with #reset() only', () => {
        const accessControl = new src_1.AccessControl(grantsObject);
        expect(accessControl.getRoles().length).toBeGreaterThan(0);
        helper_1.helper.expectAccessControlError(() => accessControl.setGrants());
        helper_1.helper.expectAccessControlError(() => accessControl.setGrants(null));
        helper_1.helper.expectAccessControlError(() => accessControl.setGrants(undefined));
        expect(accessControl.reset().getGrants()).toEqual({});
        expect(accessControl.setGrants({}).getGrants()).toEqual({});
    });
    test('add grants from flat list (db), check/remove roles and resources', () => {
        const accessControl = new src_1.AccessControl();
        expect(accessControl.hasRole()).toEqual(false);
        expect(accessControl.hasRole(undefined)).toEqual(false);
        expect(accessControl.hasRole('')).toEqual(false);
        expect(accessControl.hasResource()).toEqual(false);
        expect(accessControl.hasResource(undefined)).toEqual(false);
        expect(accessControl.hasResource('')).toEqual(false);
        accessControl.setGrants(grantList.concat());
        const attrs1 = accessControl.can('user').createOwn('video').attributes;
        const attrs2 = accessControl.can('user').readAny('video').attributes;
        expect(attrs1.length).toEqual(1);
        expect(attrs2.length).toEqual(1);
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
        const accessControl = new src_1.AccessControl();
        const attrs = ['*'];
        accessControl.grant('user').createAny('photo', attrs);
        expect(accessControl.getGrants().user.photo['create:any']).toEqual(attrs);
        expect(accessControl.can('user').createAny('photo').attributes).toEqual(attrs);
        accessControl.deny('user').createAny('photo', attrs);
        expect(accessControl.can('user').createAny('photo').granted).toEqual(false);
        expect(accessControl.can('user').createAny('photo').attributes).toEqual([]);
        accessControl.grant('user').createOwn('photo', attrs);
        expect(accessControl.getGrants().user.photo['create:own']).toEqual(attrs);
        expect(accessControl.can('user').createOwn('photo').attributes).toEqual(attrs);
        accessControl.grant(['user', 'admin']).readAny('photo', attrs);
        expect(accessControl.can('user').readAny('photo').granted).toEqual(true);
        expect(accessControl.can('admin').readAny('photo').granted).toEqual(true);
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
        const accessControl = new src_1.AccessControl();
        helper_1.helper.expectAccessControlError(() => accessControl.grant(undefined));
        helper_1.helper.expectAccessControlError(() => accessControl.deny(undefined));
        helper_1.helper.expectAccessControlError(() => accessControl.can(undefined));
        helper_1.helper.expectAccessControlError(() => accessControl.permission(undefined));
    });
    test('aliases: #allow(), #reject(), #query()', () => {
        const accessControl = new src_1.AccessControl();
        accessControl.grant(['user', 'admin']).createAny('photo');
        expect(accessControl.can('user').createAny('photo').granted).toBe(true);
    });
    test('#permission()', () => {
        const accessControl = new src_1.AccessControl(grantsObject);
        expect(accessControl.can('admin').createAny('video').granted).toBe(true);
        const queryInfo = {
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
        const accessControl = new src_1.AccessControl();
        const attrs = ['*'];
        accessControl
            .grant('superadmin')
            .createAny('profile', attrs)
            .readAny('profile', attrs)
            .createAny('video', [])
            .createAny('photo');
        expect(accessControl.can('superadmin').createAny('profile').granted).toEqual(true);
        expect(accessControl.can('superadmin').readAny('profile').granted).toEqual(true);
        expect(accessControl.can('superadmin').createAny('video').granted).toEqual(false);
        expect(accessControl.can('superadmin').createAny('photo').granted).toEqual(true);
    });
    test('grant/deny access via object and check permissions', () => {
        const accessControl = new src_1.AccessControl();
        const attrs = ['*'];
        const o1 = {
            role: 'moderator',
            resource: 'post',
            action: 'create:any',
            attributes: ['*'],
        };
        const o2 = {
            role: 'moderator',
            resource: 'news',
            action: 'read',
            possession: 'own',
            attributes: ['*'],
        };
        const o3 = {
            role: 'moderator',
            resource: 'book',
            attributes: ['*'],
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
        accessControl.grant(o1).readOwn();
        expect(accessControl.can('moderator').readOwn('post').granted).toEqual(true);
        accessControl.deny(o1).readOwn();
        expect(accessControl.can('moderator').readOwn('post').granted).toEqual(false);
        expect(accessControl.can('moderator').updateOwn('news').granted).toEqual(false);
        expect(accessControl.can('moderator').createAny('foo').granted).toEqual(false);
    });
    test('grant/deny access (variation, chained)', () => {
        const accessControl = new src_1.AccessControl();
        accessControl.setGrants(grantsObject);
        expect(accessControl.can('admin').createAny('video').granted).toEqual(true);
        accessControl.deny('admin').create('video');
        expect(accessControl.can('admin').createAny('video').granted).toEqual(false);
        accessControl.grant('foo').createOwn('bar');
        expect(accessControl.can('foo').createAny('bar').granted).toEqual(false);
        expect(accessControl.can('foo').createOwn('bar').granted).toEqual(true);
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
        const accessControl = new src_1.AccessControl();
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
        const accessControl = new src_1.AccessControl();
        accessControl.deny('user').createAny('book', ['*']);
        expect(accessControl.getGrants().user.book['create:any']).toEqual([]);
    });
    test('grant comma/semi-colon separated roles', () => {
        const accessControl = new src_1.AccessControl();
        accessControl.grant('role2; role3, editor; viewer, agent').createOwn('book');
        expect(accessControl.hasRole('role3')).toEqual(true);
        expect(accessControl.hasRole('editor')).toEqual(true);
        expect(accessControl.hasRole('agent')).toEqual(true);
    });
    test('Permission#roles, Permission#resource', () => {
        const accessControl = new src_1.AccessControl();
        accessControl.grant('foo, bar').createOwn('baz');
        expect(accessControl.can('bar').createAny('baz').granted).toEqual(false);
        expect(accessControl.can('bar').createOwn('baz').granted).toEqual(true);
        expect(accessControl.can('foo').create('baz').roles).toContain('foo');
        expect(accessControl.can('foo').create('baz').resource).toEqual('baz');
    });
    test('Access#extend()', () => {
        const accessControl = new src_1.AccessControl();
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
        let accessControl = new src_1.AccessControl();
        function init() {
            accessControl = new src_1.AccessControl();
            accessControl.grant(['user', 'admin']);
            expect(accessControl.getRoles().length).toEqual(2);
        }
        init();
        accessControl
            .grant('admin')
            .extend('user')
            .grant('user')
            .createOwn('video');
        expect(accessControl.can('admin').createOwn('video').granted).toEqual(true);
        init();
        accessControl
            .grant('user')
            .createOwn('video')
            .grant('admin')
            .extend('user');
        expect(accessControl.can('admin').createOwn('video').granted).toEqual(true);
    });
    test('extend multi-level (deep) roles', () => {
        const accessControl = new src_1.AccessControl();
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
        const accessControl = new src_1.AccessControl();
        helper_1.helper.expectAccessControlError(() => accessControl.grant().createOwn());
        accessControl.setGrants(grantsObject);
        helper_1.helper.expectAccessControlError(() => accessControl.can('invalid-role').createOwn('video'), 'Role not found');
        helper_1.helper.expectAccessControlError(() => accessControl.grant('user').extend('invalid-role'));
        helper_1.helper.expectAccessControlError(() => accessControl.grant('user').extend(['invalid1', 'invalid2']));
    });
    test('throw on invalid or reserved names', () => {
        const accessControl = new src_1.AccessControl();
        utils.RESERVED_KEYWORDS.forEach((name) => {
            helper_1.helper.expectAccessControlError(() => accessControl.grant(name));
            helper_1.helper.expectAccessControlError(() => accessControl.deny(name));
            helper_1.helper.expectAccessControlError(() => accessControl.grant().role(name));
            helper_1.helper.expectAccessControlError(() => accessControl.grant('role').resource(name));
        });
        expect(() => accessControl.grant()).not.toThrow();
        helper_1.helper.expectAccessControlError(() => accessControl.grant(undefined));
        helper_1.helper.expectAccessControlError(() => accessControl.grant(''));
        helper_1.helper.expectAccessControlError(() => accessControl.grant(1));
        helper_1.helper.expectAccessControlError(() => accessControl.grant(true));
        helper_1.helper.expectAccessControlError(() => accessControl.grant(false));
        helper_1.helper.expectAccessControlError(() => accessControl.grant([]));
        helper_1.helper.expectAccessControlError(() => accessControl.grant({}));
        helper_1.helper.expectAccessControlError(() => new src_1.AccessControl({ $: [] }));
        helper_1.helper.expectAccessControlError(() => new src_1.AccessControl({ $extend: {} }));
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
        expect(() => new src_1.AccessControl(grants)).not.toThrow();
        const accessControl = new src_1.AccessControl();
        expect(() => accessControl.setGrants(grants)).not.toThrow();
        const grants1 = accessControl.getGrants();
        accessControl.reset();
        expect(accessControl.getGrants()).toEqual({});
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
        expect(grants1).toEqual(grants2);
    });
    test('throw if a role attempts to extend itself', () => {
        let accessControl = new src_1.AccessControl();
        helper_1.helper.expectAccessControlError(() => accessControl.grant('user').extend('user'));
        const grants = { user: { $extend: ['user'] } };
        helper_1.helper.expectAccessControlError(() => new src_1.AccessControl(grants));
        accessControl = new src_1.AccessControl();
        helper_1.helper.expectAccessControlError(() => accessControl.setGrants(grants));
    });
    test('throw on cross-role inheritance', () => {
        let accessControl = new src_1.AccessControl();
        accessControl.grant(['user', 'admin']).createOwn('video');
        expect(accessControl.getRoles().length).toEqual(2);
        accessControl.grant('admin').extend('user');
        helper_1.helper.expectAccessControlError(() => accessControl.grant('user').extend('admin'));
        accessControl.grant(['editor', 'viewer', 'sa']).createOwn('image');
        accessControl.grant('sa').extend('editor');
        accessControl.grant('editor').extend('viewer');
        helper_1.helper.expectAccessControlError(() => accessControl.grant('viewer').extend('sa'));
        let grants = {
            user: {
                $extend: ['admin'],
            },
            admin: {
                $extend: ['user'],
            },
        };
        helper_1.helper.expectAccessControlError(() => new src_1.AccessControl(grants));
        accessControl = new src_1.AccessControl();
        helper_1.helper.expectAccessControlError(() => accessControl.setGrants(grants));
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
        helper_1.helper.expectAccessControlError(() => new src_1.AccessControl(grants));
        accessControl = new src_1.AccessControl();
        helper_1.helper.expectAccessControlError(() => accessControl.setGrants(grants));
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
        helper_1.helper.expectAccessControlError(() => new src_1.AccessControl(grants));
        accessControl = new src_1.AccessControl();
        helper_1.helper.expectAccessControlError(() => accessControl.setGrants(grants));
    });
    test('throw if grant or deny objects are invalid', () => {
        const accessControl = new src_1.AccessControl();
        let o;
        o = {
            role: '',
            resource: 'post',
            action: 'create:any',
            attributes: ['*'],
        };
        expect(() => accessControl.grant(o)).toThrow();
        expect(() => accessControl.deny(o)).toThrow();
        o = {
            role: 'moderator',
            resource: null,
            action: 'create:any',
            attributes: ['*'],
        };
        expect(() => accessControl.grant(o)).toThrow();
        expect(() => accessControl.deny(o)).toThrow();
        o = {
            role: 'admin',
            resource: 'post',
            action: 'put:any',
            attributes: ['*'],
        };
        expect(() => accessControl.grant(o)).toThrow();
        expect(() => accessControl.deny(o)).toThrow();
        o = {
            role: 'admin',
            resource: 'post',
            action: null,
            attributes: ['*'],
        };
        expect(() => accessControl.grant(o)).toThrow();
        expect(() => accessControl.deny(o)).toThrow();
        o = {
            role: 'admin',
            resource: 'post',
            action: 'create:all',
            attributes: ['*'],
        };
        expect(() => accessControl.grant(o)).toThrow();
        expect(() => accessControl.deny(o)).toThrow();
        o = {
            role: 'admin2',
            resource: 'post',
            action: 'create',
            attributes: ['*'],
        };
        expect(() => accessControl.grant(o)).not.toThrow();
        expect(accessControl.can('admin2').createAny('post').granted).toEqual(true);
        expect(accessControl.can('admin2').createOwn('post').granted).toEqual(true);
        expect(() => accessControl.deny(o)).not.toThrow();
    });
    test('Check with multiple roles changes grant list (issue #2)', () => {
        const accessControl = new src_1.AccessControl();
        accessControl
            .grant('admin')
            .updateAny('video')
            .grant(['user', 'admin'])
            .updateOwn('video');
        expect(accessControl.can(['admin']).updateAny('video').granted).toEqual(true);
        accessControl.can(['user', 'admin']).updateOwn('video');
        expect(accessControl.can(['admin']).updateAny('video').granted).toEqual(true);
        expect(accessControl.can(['admin']).updateOwn('video').granted).toEqual(true);
    });
    test('grant/deny multiple roles and multiple resources', () => {
        const accessControl = new src_1.AccessControl();
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
        const accessControl = new src_1.AccessControl();
        const restrictedAttrs = ['*', '!pwd', '!id'];
        accessControl
            .grant('user')
            .updateAny('video', restrictedAttrs)
            .grant('admin')
            .extend('user');
        expect(accessControl.can('admin').updateAny('video').attributes).toEqual(['*']);
        accessControl.grant('admin').updateAny('video');
        expect(accessControl.can('admin').updateAny('video').attributes).toEqual(['*']);
        accessControl
            .grant('editor')
            .updateAny('video', ['*', '!pwd', '!id'])
            .extend('user');
        expect(accessControl.can('editor').updateAny('video').attributes).toEqual(['*']);
        accessControl
            .grant('role1')
            .createOwn('photo', ['image', 'name'])
            .grant('role2')
            .createOwn('photo', ['name', '!location'])
            .grant('role3')
            .createOwn('photo', ['*', '!location'])
            .grant('role4')
            .extend(['role1', 'role2'])
            .grant('role5')
            .extend(['role1', 'role2', 'role3']);
        expect(accessControl.can('role5').createOwn('photo').attributes).toEqual(['*']);
    });
    test('Action / Possession enumerations', () => {
        expect(src_1.AccessControl.Action).toEqual(expect.any(Object));
        expect(src_1.AccessControl.Possession).toEqual(expect.any(Object));
        expect(src_1.AccessControl.Possession.ANY).toBe('any');
        expect(src_1.AccessControl.Possession.OWN).toBe('own');
    });
    test('AccessControlError', () => {
        helper_1.helper.expectAccessControlError(() => {
            throw new src_1.AccessControl.Error();
        });
        helper_1.helper.expectAccessControlError(() => {
            throw new src_1.AccessControlError();
        });
        expect(new src_1.AccessControlError().message).toEqual('');
    });
});
//# sourceMappingURL=ac.spec.js.map