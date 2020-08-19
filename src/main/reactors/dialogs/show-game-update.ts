import { actions } from "common/actions";

import { map } from "underscore";
import { Watcher } from "common/util/watcher";

import { ModalButtonSpec } from "common/types";
import { modals } from "common/modals";
import { makeUploadButton } from "main/reactors/make-upload-button";

export default function (watcher: Watcher) {
  watcher.on(actions.showGameUpdate, async (store, action) => {
    const { update } = action.payload;
    const { game } = update;

    const { title } = game;

    let dialogTitle = ["pick_update_upload.single.title", { title }];
    let dialogMessage = ["pick_update_upload.single.message", { title }];
    let dialogDetail = ["pick_update_upload.single.detail"];

    const dialogButtons: ModalButtonSpec[] = [
      {
        icon: "moon",
        label: ["pick_update_upload.buttons.skip_update"],
        action: actions.snoozeCave({ caveId: update.caveId }),
        className: "secondary",
      },
      {
        icon: "play2",
        label: ["pick_update_upload.buttons.just_launch"],
        action: actions.queueGame({ game }),
        className: "secondary",
      },
      "cancel",
    ];

    store.dispatch(
      actions.openModal(
        modals.naked.make({
          wind: "root",
          title: dialogTitle,
          message: dialogMessage,
          detail: dialogDetail,
          bigButtons: map(update.choices, (choice) => {
            const spec: ModalButtonSpec = {
              ...makeUploadButton(choice.upload, { showSize: false }),
              action: actions.queueGameUpdate({ update, choice }),
            };
            spec.tags.push({
              icon: choice.confidence > 0.5 ? "like" : "neutral",
              label: ` ${(choice.confidence * 100).toFixed()}%`,
            });
            return spec;
          }),
          buttons: dialogButtons,
          widgetParams: null,
        })
      )
    );
  });
}
