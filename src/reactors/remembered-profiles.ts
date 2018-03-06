import { Watcher } from "./watcher";

import * as ospath from "path";
import { usersPath } from "../os/paths";

import { actions } from "../actions";

const TOKEN_FILE_NAME = "token.json";

import { modalWidgets } from "../components/modal-widgets/index";
import { withButlerClient, messages } from "../buse/index";
import { IStore } from "../types/index";

import rootLogger from "../logger";
const logger = rootLogger.child({ name: "remembered-profiles" });

export function getTokenPath(userId: string) {
  return ospath.join(usersPath(), userId, TOKEN_FILE_NAME);
}

async function fetchRememberedProfiles(store: IStore) {
  await withButlerClient(logger, async client => {
    const { profiles } = await client.call(messages.ProfileList({}));
    store.dispatch(actions.profilesRemembered({ profiles }));
  });
}

export default function(watcher: Watcher) {
  watcher.on(actions.preboot, async (store, action) => {
    await fetchRememberedProfiles(store);
    store.dispatch(actions.profilesRememberedFirstTime({}));
  });

  watcher.on(actions.logout, async (store, action) => {
    await fetchRememberedProfiles(store);
  });

  watcher.on(actions.forgetProfileRequest, async (store, action) => {
    const { profile } = action.payload;
    const { username } = profile.user;

    store.dispatch(
      actions.openModal(
        modalWidgets.naked.make({
          title: ["prompt.forget_profile.title"],
          message: ["prompt.forget_profile.message", { username }],
          detail: ["prompt.forget_profile.detail"],
          buttons: [
            {
              id: "modal-forget-profile",
              label: ["prompt.forget_profile.action"],
              action: actions.forgetProfile({ profile }),
              icon: "cross",
            },
            "cancel",
          ],
          widgetParams: null,
        })
      )
    );
  });

  watcher.on(actions.forgetProfile, async (store, action) => {
    const { profile } = action.payload;
    await withButlerClient(logger, async client => {
      await client.call(messages.ProfileForget({ profileId: profile.id }));
    });
  });
}
