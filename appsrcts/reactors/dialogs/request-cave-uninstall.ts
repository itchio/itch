
import * as invariant from "invariant";

import * as actions from "../../actions";

import fetch from "../../util/fetch";

// ¯\_(ツ)_/¯
// TODO: use market state instead
import {getGlobalMarket, getUserMarket} from "../../reactors/market";

import {IStore} from "../../types";
import {IAction, IRequestCaveUninstallPayload} from "../../constants/action-types";

async function requestCaveUninstall (store: IStore, action: IAction<IRequestCaveUninstallPayload>) {
  const {caveId} = action.payload;
  const credentials = store.getState().session.credentials;
  const globalMarket = getGlobalMarket();
  const userMarket = getUserMarket();

  const cave = globalMarket.getEntities("caves")[caveId];
  invariant(cave, "cave to uninstall exists");

  const game = await fetch.gameLazily(userMarket, credentials, cave.gameId, {game: cave.game});
  invariant(game, "was able to fetch game properly");
  const {title} = game;

  store.dispatch(actions.openModal({
    title: "",
    message: ["prompt.uninstall.message", {title}],
    buttons: [
      {
        label: ["prompt.uninstall.uninstall"],
        action: actions.queueCaveUninstall({caveId}),
        icon: "uninstall",
      },
      {
        label: ["prompt.uninstall.reinstall"],
        action: actions.queueCaveReinstall({caveId}),
        icon: "repeat",
      },
      "cancel",
    ],
  }));
}

export default requestCaveUninstall;
