import { actions } from "common/actions";

import asTask from "main/reactors/tasks/as-task";
import { Watcher } from "common/util/watcher";

import { promisedModal } from "main/reactors/modals";

import { performLaunch } from "main/reactors/launch/perform-launch";
import {
  isInternalError,
  asRequestError,
  mergeLogAndError,
} from "common/butlerd";
import { Code } from "common/butlerd/messages";
import { formatError } from "common/format/errors";
import { t } from "common/format/t";
import { showInExplorerString } from "common/format/show-in-explorer";
import { modals } from "common/modals";

export default function (watcher: Watcher) {
  watcher.on(actions.queueLaunch, async (store, action) => {
    const { cave } = action.payload;
    const { game } = cave;

    asTask({
      name: "launch",
      gameId: game.id,
      caveId: cave.id,
      store,
      work: async (ctx, logger) => {
        await performLaunch(ctx, logger, cave, game);
        store.dispatch(actions.launchEnded({}));
      },
      onError: async (e: Error, log) => {
        let title = game ? game.title : "<missing game>";

        const re = asRequestError(e);
        if (re) {
          switch (re.rpcError.code) {
            case Code.OperationAborted:
              // just ignore it
              return;

            case Code.InstallFolderDisappeared:
              // oh we can do something about that.
              store.dispatch(
                actions.openModal(
                  modals.naked.make({
                    wind: "root",
                    title: ["game.install.could_not_launch", { title }],
                    coverUrl: game.coverUrl,
                    stillCoverUrl: game.stillCoverUrl,
                    message: `The folder where **${title}** was installed doesn't exist anymore.`,
                    detail: `That means we can't open it.`,
                    bigButtons: [
                      {
                        icon: "delete",
                        label: "Remove install entry",
                        tags: [{ label: "Recommended" }],
                        action: actions.queueCaveUninstall({ caveId: cave.id }),
                      },
                      {
                        icon: "folder-open",
                        label: "Open parent folder",
                        className: "secondary",
                        tags: [{ label: "Seeing is believing." }],
                        action: actions.exploreCave({ caveId: cave.id }),
                      },
                    ],
                    buttons: ["nevermind"],
                    widgetParams: null,
                  })
                )
              );
              return;
          }
        }

        const res = await promisedModal(
          store,
          modals.showError.make({
            wind: "root",
            title: ["game.install.could_not_launch", { title }],
            coverUrl: game.coverUrl,
            stillCoverUrl: game.stillCoverUrl,
            message: t(store.getState().i18n, formatError(e)),
            detail: isInternalError(e)
              ? ["game.install.could_not_launch.detail"]
              : null,
            widgetParams: {
              rawError: e,
              log,
              game,
              forceDetails: true,
              showSendReport: true,
            },
            buttons: [
              {
                label: ["prompt.action.ok"],
                action: "widgetResponse",
              },
              {
                label: showInExplorerString(),
                className: "secondary",
                action: actions.exploreCave({ caveId: cave.id }),
              },
              "cancel",
            ],
          })
        );

        if (res && res.sendReport) {
          store.dispatch(
            actions.sendFeedback({
              log: mergeLogAndError(log, e),
            })
          );
        }
      },
    });
  });
}
