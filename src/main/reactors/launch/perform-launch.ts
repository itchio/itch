import { actions } from "common/actions";

import { Context } from "../../context";
import { Logger } from "common/logger";

import * as paths from "common/util/paths";

import { Cancelled, ILocalizedString } from "common/types";

import { promisedModal } from "../modals";
import { messages, setupClient } from "common/butlerd/index";
import { shell, powerSaveBlocker } from "electron";
import { Game, PrereqStatus, Cave } from "common/butlerd/messages";

import { pickManifestAction } from "./pick-manifest-action";
import { performHTMLLaunch } from "./perform-html-launch";
import { Client } from "butlerd";
import { modalWidgets, ITypedModal } from "renderer/components/modal-widgets";
import { IPrereqsStateParams } from "renderer/components/modal-widgets/prereqs-state";
export async function performLaunch(
  ctx: Context,
  logger: Logger,
  cave: Cave,
  game: Game
) {
  ctx.emitProgress({ progress: -1, stage: "configure" });

  const { store } = ctx;
  const taskId = ctx.getTaskId();
  store.dispatch(
    actions.taskProgress({
      id: taskId,
      progress: -1,
      stage: "prepare",
    })
  );

  // TODO: have butler check morphing and queue a heal if needed
  const { appVersion } = store.getState().system;
  logger.info(`itch ${appVersion} launching '${game.title}' (#${game.id})`);

  const { preferences } = store.getState();
  const prereqsDir = paths.prereqsPath();

  // TODO: extract that to another module
  let prereqsModal: ITypedModal<any, any>;
  let prereqsStateParams: IPrereqsStateParams;

  function closePrereqsModal() {
    if (!prereqsModal) {
      return;
    }

    store.dispatch(
      actions.closeModal({
        window: "root",
        id: prereqsModal.id,
      })
    );
    prereqsModal = null;
  }

  let powerSaveBlockerId = null;

  let client: Client;
  let cancelled = false;

  await ctx.withStopper({
    work: async () => {
      client = new Client(store.getState().butlerd.endpoint);
      await client.connect();
      try {
        setupClient(client, logger, ctx);

        client.on(messages.PickManifestAction, async ({ actions }) => {
          const index = await pickManifestAction(store, actions, game);
          return { index };
        });

        client.on(messages.HTMLLaunch, async params => {
          return await performHTMLLaunch({
            ctx,
            logger,
            game,
            params,
          });
        });

        client.on(messages.ShellLaunch, async ({ itemPath }) => {
          shell.openItem(itemPath);
          return {};
        });

        client.on(messages.URLLaunch, async ({ url }) => {
          store.dispatch(actions.navigate({ window: "root", url }));
          return {};
        });

        client.on(messages.PrereqsStarted, async ({ tasks }) => {
          prereqsStateParams = {
            gameTitle: game.title,
            tasks: {},
          };

          for (const name of Object.keys(tasks)) {
            const task = tasks[name];
            prereqsStateParams.tasks[name] = {
              fullName: task.fullName,
              order: task.order,
              status: PrereqStatus.Pending,
              progress: 0,
              eta: 0,
              bps: 0,
            };
          }

          prereqsModal = modalWidgets.prereqsState.make({
            window: "root",
            title: ["grid.item.installing"],
            message: "",
            widgetParams: prereqsStateParams,
            buttons: [
              {
                id: "modal-cancel",
                label: ["prompt.action.cancel"],
                action: actions.abortTask({ id: ctx.getTaskId() }),
                className: "secondary",
              },
            ],
            unclosable: true,
          });
          store.dispatch(actions.openModal(prereqsModal));
        });

        client.on(
          messages.PrereqsTaskState,
          async ({ name, status, progress, eta, bps }) => {
            if (!prereqsModal) {
              return;
            }

            let state = {
              ...prereqsStateParams.tasks[name],
              status,
              progress,
              eta,
              bps,
            };

            let tasks = {
              ...prereqsStateParams.tasks,
              [name]: state,
            };

            prereqsStateParams = { ...prereqsStateParams, tasks };

            store.dispatch(
              actions.updateModalWidgetParams(
                modalWidgets.prereqsState.update({
                  id: prereqsModal.id,
                  widgetParams: prereqsStateParams,
                })
              )
            );
          }
        );

        client.on(messages.PrereqsFailed, async ({ errorStack, error }) => {
          closePrereqsModal();

          const { title } = game;
          let errorMessage = error;
          errorMessage = errorMessage.split("\n")[0];

          let log = "(empty)\n";
          if (logger.customOut && logger.customOut.toString) {
            log = logger.customOut.toString();
          }

          const res = await promisedModal(
            store,
            modalWidgets.showError.make({
              window: "root",
              title: ["game.install.could_not_launch", { title }],
              message: [
                "game.install.could_not_launch.message",
                { title, errorMessage },
              ],
              detail: ["game.install.could_not_launch.detail"],
              widgetParams: {
                game,
                rawError: { stack: errorStack },
                log,
              },
              buttons: [
                {
                  label: ["prompt.action.continue"],
                  action: actions.modalResponse({
                    continue: true,
                  }),
                },
                "cancel",
              ],
            })
          );

          if (res) {
            return { continue: true };
          }

          return { continue: false };
        });

        client.on(messages.PrereqsEnded, async () => {
          closePrereqsModal();
        });

        client.on(messages.LaunchWindowShouldBeForeground, async ({ hwnd }) => {
          try {
            require("asfw").SetForegroundWindow(hwnd);
          } catch (e) {
            logger.warn(`Could not set foreground window: ${e.stack}`);
          }
        });

        client.on(messages.LaunchRunning, async () => {
          logger.info("Now running!");
          ctx.emitProgress({ progress: 1, stage: "run" });

          if (preferences.preventDisplaySleep) {
            powerSaveBlockerId = powerSaveBlocker.start(
              "prevent-display-sleep"
            );
          }
        });

        client.on(messages.LaunchExited, async () => {
          logger.info("Exited!");
          ctx.emitProgress({ progress: -1, stage: "clean" });
        });

        client.on(messages.AllowSandboxSetup, async () => {
          let messageString: ILocalizedString = "";
          let detailString: ILocalizedString = "";

          if (process.platform === "win32") {
            messageString = ["sandbox.setup.windows.message"];
            detailString = ["sandbox.setup.windows.detail"];
          } else {
            messageString = ["sandbox.setup.linux.message"];
            detailString = ["sandbox.setup.linux.detail"];
          }

          const res = await promisedModal(
            store,
            modalWidgets.sandboxBlessing.make({
              window: "root",
              title: ["sandbox.setup.title"],
              message: messageString,
              detail: detailString,
              widgetParams: {},
              buttons: [
                {
                  label: ["sandbox.setup.proceed"],
                  action: modalWidgets.sandboxBlessing.action({
                    sandboxBlessing: true,
                  }),
                  icon: "security",
                },
                "cancel",
              ],
            })
          );
          if (res && res.sandboxBlessing) {
            return { allow: true };
          }

          return { allow: false };
        });

        await client.call(messages.Launch, {
          caveId: cave.id,
          prereqsDir,
          sandbox: preferences.isolateApps,
        });
      } finally {
        closePrereqsModal();
        client.close();
        if (powerSaveBlockerId) {
          powerSaveBlocker.stop(powerSaveBlockerId);
        }
      }
    },
    stop: async () => {
      logger.debug(`Asked to stop, cancelling butler process`);
      cancelled = true;
      if (client) {
        await client.call(messages.LaunchCancel, {});
      }
    },
  });

  if (cancelled) {
    logger.debug(`throwing cancelled`);
    throw new Cancelled();
  }
}
