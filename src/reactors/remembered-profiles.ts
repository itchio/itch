import { Watcher } from "./watcher";

import { actions } from "../actions";

import { modalWidgets } from "../components/modal-widgets/index";
import { withButlerClient, messages } from "../buse/index";

import rootLogger from "../logger";
const logger = rootLogger.child({ name: "remembered-profiles" });

export default function(watcher: Watcher) {
  watcher.on(actions.forgetProfileRequest, async (store, action) => {
    const { profile } = action.payload;
    const { username } = profile.user;

    store.dispatch(
      actions.openModal(
        modalWidgets.naked.make({
          title: ["prompt.forget_session.title"],
          message: ["prompt.forget_session.message", { username }],
          detail: ["prompt.forget_session.detail"],
          buttons: [
            {
              id: "modal-forget-profile",
              label: ["prompt.forget_session.action"],
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
