
import {Watcher} from "../watcher";
import * as actions from "../../actions";
import {MODAL_RESPONSE} from "../../constants/action-types";

import {getUserMarket, getGlobalMarket} from "../market";
import pathmaker from "../../util/pathmaker";
import mklog from "../../util/log";
const log = mklog("revert-cave");

import format, {DATE_FORMAT} from "../../util/format";

import client from "../../util/api";

import {ICaveRecord, IDownloadKey} from "../../types";
import {map, filter, findWhere} from "underscore";

import {promisedModal} from "../modals";

import findUpgradePath from "../../tasks/find-upgrade-path";
import {EventEmitter} from "events";
import {IRevertCaveParams} from "../../components/modal-widgets/revert-cave";

import localizer from "../../localizer";

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
        log(opts, `Cave isn't wharf-enabled, can't revert: ${caveId}`);
        return;
      }
      
      const upload = cave.uploads[cave.uploadId];
      if (!cave.buildId) {
        log(opts, `No upload in acve, can't revert: ${caveId}`);
        return;
      }

      const market = getUserMarket();
      const downloadKey = cave.downloadKey ||
        findWhere(market.getEntities<IDownloadKey>("downloadKeys"), {gameId: cave.game.id});

      const credentials = store.getState().session.credentials;
      if (!credentials) {
        log(opts, `No credentials, cannot revert to build`);
        return;
      }
      const keyClient = client.withKey(credentials.key);
      const buildsList = await keyClient.listBuilds(downloadKey, upload.id);

      log(opts, `Builds list:\n${JSON.stringify(buildsList, null, 2)}`);

      const oldBuilds = filter(buildsList.builds, (build) => {
        return build.id < cave.buildId;
      });

      const i18n = store.getState().i18n;
      const t = localizer.getT(i18n.strings, i18n.lang);

      const response = await promisedModal(store, {
        title: t("prompt.revert.title"),
        message: "",
        widget: "revert-cave",
        widgetParams: {
          currentCave: cave,
        } as IRevertCaveParams,
        bigButtons: map(oldBuilds, (build) => {
          let label = "";
          if (build.userVersion) {
            label = `${build.userVersion}`;
          } else {
            label = `#${build.id}`;
          }

          // TODO: check, I have doubts about this Date constructor
          label = `${label} — ${format.date(new Date(build.updatedAt), DATE_FORMAT, i18n.lang)}`;

          return {
            label,
            icon: "tag",
            action: actions.modalResponse({
              revertBuildId: build.id,
            }),
          };
        }),
        buttons: [
          {
            label: t("prompt.revert.action.revert"),
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
        message: t("status.reverting", {buildId}),
      }));

      const changedUpload = {
        ...upload,
        buildId,
      };

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
