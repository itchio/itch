
import * as actions from "../../actions";

import sf from "../../util/sf";
import pathmaker from "../../util/pathmaker";
import explorer from "../../util/explorer";

import {getGlobalMarket} from "../market";
import {log, opts} from "./log";

import {IStore} from "../../types";
import {IAction, IExploreCavePayload} from "../../constants/action-types";

export async function exploreCave (store: IStore, action: IAction<IExploreCavePayload>) {
  const {caveId} = action.payload;
  const market = getGlobalMarket();

  const cave = market.getEntity("caves", caveId);
  if (!cave) {
    log(opts, `Cave not found, can't explore: ${caveId}`);
    return;
  }
  const appPath = pathmaker.appPath(cave);

  const exists = await sf.exists(appPath);
  if (exists) {
    explorer.open(appPath);
  } else {
    store.dispatch(actions.probeCave(action.payload));
  }
}
