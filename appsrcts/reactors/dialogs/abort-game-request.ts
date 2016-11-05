
import * as actions from "../../actions";

import {IStore} from "../../types/db";
import {IAction, IAbortGameRequestPayload} from "../../constants/action-types";

async function abortGameRequest (store: IStore, action: IAction<IAbortGameRequestPayload>) {
  const {game} = action.payload;

  store.dispatch(actions.openModal({
    title: ["prompt.abort_game.title"],
    message: ["prompt.abort_game.message", {title: game.title}],
    buttons: [
      {
        label: ["prompt.action.force_close"],
        action: actions.abortGame({gameId: game.id}),
        icon: "cross",
      },
      "cancel",
    ],
  }));
}

export default abortGameRequest;
