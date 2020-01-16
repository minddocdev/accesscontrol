import { Action } from './Action';
import { Possession } from './Possession';

// const actions: string[] = Object.keys(Action).map((k: string) => Action[k]);
// const possessions: string[] = Object.keys(Possession).map((k: string) => {
//   return Possession[k];
// });

const actions: string[] = Object.values(Action).map((v: string) => v);
const possessions: string[] = Object.values(Possession).map((v: string) => v);

export {
  Action,
  actions,
  Possession,
  possessions,
};
