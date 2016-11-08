
import {app} from "../electron";
import sf from "../util/sf";
import * as ospath from "path";

import * as invariant from "invariant";
import {map, indexBy} from "underscore";

import * as actions from "../actions";

const TOKEN_FILE_NAME = "token.json";
const USERS_PATH = ospath.join(app.getPath("userData"), "users");

import {IStore} from "../types";
import {
  IAction,
  IForgetSessionPayload,
  IForgetSessionRequestPayload,
  ILoginSucceededPayload,
} from "../constants/action-types";

export function getTokenPath (userId: string) {
  return ospath.join(USERS_PATH, userId, TOKEN_FILE_NAME);
}

async function loadRememberedSessions (store: IStore) {
  // not using '**', as that would find arbitrarily deep files
  const tokenFiles = await sf.glob(`*/${TOKEN_FILE_NAME}`, {cwd: USERS_PATH, nodir: true});

  const contents = await Promise.all(map(tokenFiles, (tokenFile) =>
    sf.readFile(ospath.join(USERS_PATH, tokenFile))
  ));
  const sessions = map(contents, (content) => JSON.parse(content));

  if (sessions.length > 0) {
    const sessionsById = indexBy(sessions, (x) => x.me.id);
    store.dispatch(actions.sessionsRemembered(sessionsById));
  }
}

async function firstWindowReady (store: IStore) {
  await loadRememberedSessions(store);
}

async function forgetSessionRequest (store: IStore, action: IAction<IForgetSessionRequestPayload>) {
  const {id, username} = action.payload;
  store.dispatch(actions.openModal({
    title: ["prompt.forget_session.title"],
    message: ["prompt.forget_session.message", {username}],
    detail: ["prompt.forget_session.detail"],
    buttons: [
      {
        label: ["prompt.forget_session.action"],
        action: actions.forgetSession({id, username}),
        icon: "cross",
      },
      "cancel",
    ],
  }));
}

async function forgetSession (store: IStore, action: IAction<IForgetSessionPayload>) {
  const {id} = action.payload;

  const tokenPath = getTokenPath(String(id));
  await sf.wipe(tokenPath);
}

async function saveSession (store: IStore, userId: string, record: any) {
  invariant(typeof store === "object", "saveSession needs store object");

  const tokenPath = getTokenPath(userId);
  let oldRecord: any = {};
  try {
    const oldContent = await sf.readFile(tokenPath);
    oldRecord = JSON.parse(oldContent);
  } catch (e) {
    // muffin
  }

  const finalRecord = Object.assign({}, oldRecord, record, {lastConnected: Date.now()});
  const content = JSON.stringify(finalRecord);
  await sf.writeFile(tokenPath, content);

  // first time connecting?
  if (!oldRecord.lastConnected) {
    store.dispatch(actions.startOnboarding());
  }

  store.dispatch(actions.sessionUpdated({id: userId, record: finalRecord}));
}

async function loginSucceeded (store: IStore, action: IAction<ILoginSucceededPayload>) {
  const {key, me} = action.payload;
  await saveSession(store, String(me.id), {key, me});
}

export default {firstWindowReady, forgetSessionRequest, forgetSession, loginSucceeded};
