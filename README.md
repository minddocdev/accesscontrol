# Role Based Access Control (RBAC)

Many Role Based Access Control (RBAC) implementations differ, but the basics is widely adopted since it simulates real life role (job) assignments. But while data is getting more and more complex; you need to define policies on resources, subjects or even environments, this is called Attribute Based Access Control (ABAC).

## Core Features

- Chainable, friendly API, e.g. `ac.can(role).create(resource)`
- Role hierarchical **inheritance**.
- Define grants **at once** (e.g. from database result) or **one by one**.
- Grant/deny permissions by attributes defined by **glob notation**.
- Ability to control access on **own** or **any** resources.
- No **silent** errors.
- **Fast**. (Grants are stored in memory, no database queries.)

## Getting Started

```bash
yarn install
```

```bash
yarn build
```

```bash
yarn test
```

## Installation

```bash
yarn add @minddocdev/accesscontrol
```

## Publishing

To publish a new version of the package, firstly bump the version in the `package.json` file,
then cut a new release on [Github](https://github.com/minddocdev/accesscontrol/releases). This
will automatically initiate the `publish` Github Action workflow and publish a new version to
[Github Packages](https://github.com/minddocdev/accesscontrol/packages)

## Guide

```typescript
import { AccessControl } from 'accesscontrol';
```

### Basic Example

Define roles and grants one by one.

```typescript
const ac = new AccessControl();
ac.grant('user') // define new or modify existing role. also takes an array.
  .createOwn('video') // equivalent to .createOwn('video', ['*'])
  .deleteOwn('video')
  .readAny('video')
  .grant('admin') // switch to another role without breaking the chain
  .extend('user') // inherit role capabilities. also takes an array
  .updateAny('video', ['title']) // explicitly defined attributes
  .deleteAny('video');

const permission = ac.can('user').createOwn('video');
console.log(permission.granted); // —> true
console.log(permission.attributes); // —> ['*'] (all attributes)

permission = ac.can('admin').updateAny('video');
console.log(permission.granted); // —> true
console.log(permission.attributes); // —> ['title']
```

## Roles

You can create/define roles simply by calling `.grant(<role>)` or `.deny(<role>)` methods on an `AccessControl` instance.

- Roles can extend other roles.

```typescript
// user role inherits viewer role permissions
ac.grant('user').extend('viewer');
// admin role inherits both user and editor role permissions
ac.grant('admin').extend(['user', 'editor']);
// both admin and superadmin roles inherit moderator permissions
ac.grant(['admin', 'superadmin']).extend('moderator');
```

- Inheritance is done by reference, so you can grant resource permissions before or after extending a role.

```typescript
// case #1
ac.grant('admin')
  .extend('user') // assuming user role already exists
  .grant('user')
  .createOwn('video');

// case #2
ac.grant('user')
  .createOwn('video')
  .grant('admin')
  .extend('user');

// below results the same for both cases
const permission = ac.can('admin').createOwn('video');
console.log(permission.granted); // true
```

Notes on inheritance:

- A role cannot extend itself.
- Cross-inheritance is not allowed.  
  e.g. `ac.grant('user').extend('admin').grant('admin').extend('user')` will throw.
- A role cannot (pre)extend a non-existing role. In other words, you should first create the base role. e.g. `ac.grant('baseRole').grant('role').extend('baseRole')`

## Actions and Action-Attributes

[CRUD][crud] operations are the actions you can perform on a resource. There are two action-attributes which define the **possession** of the resource: _own_ and _any_.

For example, an `admin` role can `create`, `read`, `update` or `delete` (CRUD) **any** `account` resource. But a `user` role might only `read` or `update` its **own** `account` resource.

<table>
    <thead>
        <tr>
            <th>Action</th>
            <th>Possession</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td rowspan="2">
            <b>C</b>reate<br />
            <b>R</b>ead<br />
            <b>U</b>pdate<br />
            <b>D</b>elete<br />
            </td>
            <td>Own</td>
            <td>The C|R|U|D action is (or not) to be performed on own resource(s) of the current subject.</td>
        </tr>
        <tr>
            <td>Any</td>
            <td>The C|R|U|D action is (or not) to be performed on any resource(s); including own.</td>
        </tr>   
    </tbody>
</table>

```typescript
ac.grant('role').readOwn('resource');
ac.deny('role').deleteAny('resource');
```

_Note that **own** requires you to also check for the actual possession._

## Checking Permissions

You can call `.can(<role>).<action>(<resource>)` on an `AccessControl` instance to check for granted permissions for a specific resource and action.

```typescript
const permission = ac.can('user').readOwn('account');
permission.granted; // true
```

## Defining All Grants at Once

You can pass the grants directly to the `AccessControl` constructor.
It accepts either an `Object`:

```typescript
// This is actually how the grants are maintained internally.
let grantsObject = {
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
const ac = new AccessControl(grantsObject);
```

... or an `Array` (useful when fetched from a database):

```typescript
// grant list fetched from DB (to be converted to a valid grants object, internally)
let grantList = [
  { role: 'admin', resource: 'video', action: 'create:any', attributes: '*' },
  { role: 'admin', resource: 'video', action: 'read:any', attributes: '*' },
  { role: 'admin', resource: 'video', action: 'update:any', attributes: '*' },
  { role: 'admin', resource: 'video', action: 'delete:any', attributes: '*' },

  { role: 'user', resource: 'video', action: 'create:own', attributes: '*' },
  { role: 'user', resource: 'video', action: 'read:any', attributes: '*' },
  { role: 'user', resource: 'video', action: 'update:own', attributes: '*' },
  { role: 'user', resource: 'video', action: 'delete:own', attributes: '*' },
];
const ac = new AccessControl(grantList);
```

You can set grants any time...

```typescript
const ac = new AccessControl();
ac.setGrants(grantsObject);
console.log(ac.getGrants());
```

## Contribution Guidelines

Never commit directly to master, create a new branch and submit a pull request.
