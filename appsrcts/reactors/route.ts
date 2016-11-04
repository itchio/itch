
import {IStore} from "../types/db";
import {IAction} from "../constants/action-types";

interface IReactor {
  (store: IStore, action: IAction<any>): void;
}

interface IReactorMap {
  [actionType: string]: IReactor;
  _ALL: IReactor;
}

export default function route (reactors: IReactorMap, store: IStore, action: IAction<any>) {
  const reactor = reactors[action.type];
  if (reactor) {
    reactor(store, action);
  }

  const catchall = reactors._ALL;
  if (catchall) {
    catchall(store, action);
  }
}
