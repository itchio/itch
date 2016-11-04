
import {getGlobalMarket} from "../market";

import {IStore} from "../../types/db";
import {IAction, IImplodeCavePayload} from "../../constants/action-types";

export async function implodeCave (store: IStore, action: IAction<IImplodeCavePayload>) {
  const {caveId} = action.payload;

  const market = getGlobalMarket();
  await market.deleteEntity("caves", caveId, {wait: true});
}
