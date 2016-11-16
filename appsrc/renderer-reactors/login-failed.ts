
import {Watcher} from "../reactors/watcher";
import * as actions from "../actions";

export default function (watcher: Watcher) {
  watcher.on(actions.loginFailed, async (store, action) => {
    const {username} = action.payload;
    const usernameField = document.querySelector("#login-username") as HTMLInputElement;
    if (usernameField) {
      usernameField.value = username;
    }
  });
}
