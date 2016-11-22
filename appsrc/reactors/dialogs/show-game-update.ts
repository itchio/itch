
import * as actions from "../../actions";

import * as humanize from "humanize-plus";

import {map} from "underscore";
import {Watcher} from "../watcher";

export default function (watcher: Watcher) {
  watcher.on(actions.showGameUpdate, async (store, action) =>  {
    const update = action.payload.update;
    const {game} = update;

    const {title} = game;
    store.dispatch(actions.openModal({
      title: ["pick_update_upload.title", {title}],
      message: ["pick_update_upload.message", {title}],
      detail: ["pick_update_upload.detail"],
      bigButtons: map(update.recentUploads, (upload) => {
        return {
          label: `${upload.displayName || upload.filename} (${humanize.fileSize(upload.size)})`,
          timeAgo: {
            label: ["prompt.updated_ago"],
            date: Date.parse(upload.updatedAt),
          },
          action: actions.queueGameUpdate(Object.assign({}, action.payload, {upload, handPicked: true})),
          icon: "download",
        };
      }),
      buttons: [
        "cancel",
      ],
    }));
  });
};
