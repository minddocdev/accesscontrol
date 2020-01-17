import { AccessControl } from '../../src';

console.log(AccessControl);
const ac = new AccessControl();
ac.setGrants({
  user: {
    resource: {
      'create:any': ['*'],
    },
  },
});
console.log(ac.getGrants());
