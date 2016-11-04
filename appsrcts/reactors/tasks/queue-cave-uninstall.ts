
import {getGlobalMarket} from "../market";

import * as actions from "../../actions";

import {startTask} from "./start-task";

import {IStore} from "../../types/db";
import {IAction, IQueueCaveUninstallPayload} from "../../constants/action-types";

export async function queueCaveUninstall (store: IStore, action: IAction<IQueueCaveUninstallPayload>) {
  const {caveId} = action.payload;

  // TODO: use state instead
  const cave = getGlobalMarket().getEntity("caves", caveId);
  if (!cave) {
    // no such cave, can't uninstall!
    return;
  }

  await startTask(store, {
    name: "uninstall",
    gameId: cave.gameId,
    cave,
  });

  store.dispatch(actions.clearGameDownloads({gameId: cave.gameId}));
}
