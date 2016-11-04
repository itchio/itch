
import * as querystring from "querystring";

import * as actions from "../actions";

import {IStore} from "../types/db";
import {IAction, IInitiateSharePayload} from "../constants/action-types";

async function initiateShare (store: IStore, action: IAction<IInitiateSharePayload>) {
  const {url} = action.payload;
  const query = querystring.stringify({url});
  store.dispatch(actions.openUrl(`https://www.addtoany.com/share?${query}`));
}

export default {initiateShare};
