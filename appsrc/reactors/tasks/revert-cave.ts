
import {Watcher} from "../watcher";
import * as actions from "../../actions";
import {MODAL_RESPONSE} from "../../constants/action-types";

import {getUserMarket, getGlobalMarket} from "../market";
import pathmaker from "../../util/pathmaker";
import mklog from "../../util/log";
const log = mklog("revert-cave");

import {ICaveRecord, IDownloadKey} from "../../types";
import {findWhere} from "underscore";

import {promisedModal} from "../modals";

import findUpgradePath from "../../tasks/find-upgrade-path";
import {EventEmitter} from "events";
import {IRevertCaveParams} from "../../components/modal-widgets/revert-cave";

export default function (watcher: Watcher) {
  watcher.on(actions.revertCaveRequest, async (store, action) => {
    const {caveId} = action.payload;
    const logger = pathmaker.caveLogger(caveId);
    const opts = {
      logger,
    };

    try {
      const globalMarket = getGlobalMarket();

      const cave = globalMarket.getEntity<ICaveRecord>("caves", caveId);
      if (!cave) {
        log(opts, `Cave not found, can't revert: ${caveId}`);
        return;
      }

      if (!cave.buildId) {
        log(opts, `Cave isn't wharf-enabled, can't revert : ${caveId}`);
        return;
      }

      const response = await promisedModal(store, {
        title: "Revert to given build",
        message: "",
        widget: "revert-cave",
        widgetParams: {
          currentCave: cave,
        } as IRevertCaveParams,
        buttons: [
          {
            label: "Revert",
            icon: "checkmark",
            action: actions.modalResponse({}),
            actionSource: "widget",
          },
          "cancel",
        ],
      });

      if (response.type !== MODAL_RESPONSE) {
        // modal was closed
        return;
      }

      const buildId = response.payload.revertBuildId;

      const upload = cave.uploads[cave.uploadId];
      const credentials = store.getState().session.credentials;
      const market = getUserMarket();

      const downloadKey = cave.downloadKey ||
        findWhere(market.getEntities<IDownloadKey>("downloadKeys"), {gameId: cave.game.id});

      const upgradeOpts = {
        market,
        credentials,
        upload,
        gameId: cave.game.id,
        currentBuildId: buildId,
        downloadKey,
      };
      const out = new EventEmitter();

      try {
        // this will throw if the buildId isn't in the chain of builds of the current upload
        await findUpgradePath(out, upgradeOpts);
      } catch (e) {
        log(opts, `Could not get upgrade path: ${e}`);
        store.dispatch(actions.statusMessage({
          message: e.message,
        }));
      }

      store.dispatch(actions.statusMessage({
        message: `Reverting to ${buildId}...`,
      }));

      const changedUpload = Object.assign({}, upload, {
        buildId,
      });

      store.dispatch(actions.queueDownload({
        cave: cave,
        game: cave.game,
        upload: changedUpload,
        downloadKey,
        reason: "revert",
        destPath: null,
        heal: true,
      }));
    } finally {
      logger.close();
    }
  });
}
