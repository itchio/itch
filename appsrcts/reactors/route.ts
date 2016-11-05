
import {IStore} from "../types/db";
import {IAction} from "../constants/action-types";

import {ICombinator} from "./combine";

export default function route (reactors: ICombinator, store: IStore, action: IAction<any>) {
  const reactor = reactors[action.type];
  if (reactor) {
    reactor(store, action);
  }

  const catchall = reactors._ALL;
  if (catchall) {
    catchall(store, action);
  }
}
