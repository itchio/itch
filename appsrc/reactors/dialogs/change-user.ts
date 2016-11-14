
import * as actions from "../../actions";

import {IStore} from "../../types";
import {IAction, IChangeUserPayload} from "../../constants/action-types";

async function changeUser (store: IStore, action: IAction<IChangeUserPayload>) {
  store.dispatch(actions.openModal({
    title: ["prompt.logout_title"],
    message: ["prompt.logout_confirm"],
    detail: ["prompt.logout_detail"],
    buttons: [
      {
        label: ["prompt.logout_action"],
        action: actions.logout({}),
        icon: "exit",
      },
      "cancel",
    ],
  }));
}

export default changeUser;
