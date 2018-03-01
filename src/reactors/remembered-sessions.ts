import { Watcher } from "./watcher";

import * as ospath from "path";
import { usersPath } from "../os/paths";

import { actions } from "../actions";

const TOKEN_FILE_NAME = "token.json";

import { modalWidgets } from "../components/modal-widgets/index";
import { withButlerClient, messages } from "../buse/index";
import { IStore } from "../types/index";

import rootLogger from "../logger";
const logger = rootLogger.child({ name: "remembered-sessions" });

export function getTokenPath(userId: string) {
  return ospath.join(usersPath(), userId, TOKEN_FILE_NAME);
}

async function fetchRememberedSessions(store: IStore) {
  await withButlerClient(logger, async client => {
    const { sessions } = await client.call(messages.SessionList({}));
    store.dispatch(actions.sessionsRemembered({ sessions }));
  });
}

export default function(watcher: Watcher) {
  watcher.on(actions.preboot, async (store, action) => {
    await fetchRememberedSessions(store);
    store.dispatch(actions.sessionsRememberedFirstTime({}));
  });

  watcher.on(actions.logout, async (store, action) => {
    await fetchRememberedSessions(store);
  });

  watcher.on(actions.forgetSessionRequest, async (store, action) => {
    const { session } = action.payload;
    const { username } = session.user;

    store.dispatch(
      actions.openModal(
        modalWidgets.naked.make({
          title: ["prompt.forget_session.title"],
          message: ["prompt.forget_session.message", { username }],
          detail: ["prompt.forget_session.detail"],
          buttons: [
            {
              id: "modal-forget-session",
              label: ["prompt.forget_session.action"],
              action: actions.forgetSession({ session }),
              icon: "cross",
            },
            "cancel",
          ],
          widgetParams: null,
        })
      )
    );
  });

  watcher.on(actions.forgetSession, async (store, action) => {
    const { session } = action.payload;
    await withButlerClient(logger, async client => {
      await client.call(messages.SessionForget({ sessionId: session.id }));
    });
  });
}
