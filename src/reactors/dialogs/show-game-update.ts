import { actions } from "../../actions";

import makeUploadButton from "../../reactors/make-upload-button";

import { map } from "underscore";
import { Watcher } from "../watcher";

import { IModalButtonSpec } from "../../types";
import { modalWidgets } from "../../components/modal-widgets/index";

export default function(watcher: Watcher) {
  watcher.on(actions.showGameUpdate, async (store, action) => {
    const { update } = action.payload;
    const { game, upload } = update;
    const uploads = [upload];

    const { title } = game;

    let dialogTitle = ["pick_update_upload.single.title", { title }];
    let dialogMessage = ["pick_update_upload.single.message", { title }];
    let dialogDetail = ["pick_update_upload.single.detail"];

    const dialogButtons: IModalButtonSpec[] = [
      {
        icon: "download",
        label: ["pick_update_upload.buttons.update"],
        action: actions.queueGameUpdate({ update }),
      },
      {
        icon: "play",
        label: ["pick_update_upload.buttons.just_launch"],
        action: actions.queueGame({ game }),
        className: "secondary",
      },
      "cancel",
    ];

    store.dispatch(
      actions.openModal(
        modalWidgets.naked.make({
          title: dialogTitle,
          message: dialogMessage,
          detail: dialogDetail,
          bigButtons: map(uploads, upload => {
            const spec: IModalButtonSpec = {
              ...makeUploadButton(upload, { showSize: false }),
              action: actions.queueGameUpdate({ update }),
            };
            return spec;
          }),
          buttons: dialogButtons,
          widgetParams: null,
        })
      )
    );
  });
}
