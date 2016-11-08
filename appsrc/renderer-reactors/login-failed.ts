
import {IStore} from "../types";
import {IAction, ILoginFailedPayload} from "../constants/action-types";

async function loginFailed (store: IStore, action: IAction<ILoginFailedPayload>) {
  const {username} = action.payload;
  const usernameField = document.querySelector("#login-username") as HTMLInputElement;
  if (usernameField) {
    usernameField.value = username;
  }
}

export default {loginFailed};
