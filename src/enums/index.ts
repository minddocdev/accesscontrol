import { Action } from './Action';
import { Possession } from './Possession';

const actions: string[] = Object.values(Action).map((v: string) => v);
const possessions: string[] = Object.values(Possession).map((v: string) => v);

export { Action, actions, Possession, possessions };
