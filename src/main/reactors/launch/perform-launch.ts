import { Client } from "butlerd";
import { actions } from "common/actions";
import { messages, hookLogging } from "common/butlerd/index";
import { Cave, Game, PrereqStatus } from "common/butlerd/messages";
import { Logger } from "common/logger";
import { modals, TypedModal } from "common/modals";
import { PrereqsStateParams } from "common/modals/types";
import { Cancelled, LocalizedString } from "common/types";
import * as paths from "common/util/paths";
import { powerSaveBlocker, shell } from "electron";
import { Context } from "../../context";
import { promisedModal } from "../modals";
import { performHTMLLaunch } from "./perform-html-launch";
import { pickManifestAction } from "./pick-manifest-action";
import { mcall } from "main/butlerd/mcall";
import { itchSetupLock } from "main/broth/itch-setup";

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
  let prereqsModal: TypedModal<any, any>;
  let prereqsStateParams: PrereqsStateParams;

  function closePrereqsModal() {
    if (!prereqsModal) {
      return;
    }

    store.dispatch(
      actions.closeModal({
        wind: "root",
        id: prereqsModal.id,
      })
    );
    prereqsModal = null;
  }

  let powerSaveBlockerId: number = null;

  let client: Client;
  let cancelled = false;

  await ctx.withStopper({
    work: async () => {
      try {
        await mcall(
          messages.Launch,
          {
            caveId: cave.id,
            prereqsDir,
            sandbox: preferences.isolateApps,
          },
          convo => {
            hookLogging(convo, logger);

            convo.on(messages.PickManifestAction, async ({ actions }) => {
              const index = await pickManifestAction(store, actions, game);
              return { index };
            });

            convo.on(messages.HTMLLaunch, async params => {
              return await performHTMLLaunch({
                ctx,
                logger,
                game,
                params,
              });
            });

            convo.on(messages.ShellLaunch, async ({ itemPath }) => {
              shell.openItem(itemPath);
              return {};
            });

            convo.on(messages.URLLaunch, async ({ url }) => {
              store.dispatch(actions.navigate({ wind: "root", url }));
              return {};
            });

            convo.on(messages.PrereqsStarted, async ({ tasks }) => {
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

              prereqsModal = modals.prereqsState.make({
                wind: "root",
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

            convo.on(
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
                    modals.prereqsState.update({
                      id: prereqsModal.id,
                      widgetParams: prereqsStateParams,
                    })
                  )
                );
              }
            );

            convo.on(messages.PrereqsFailed, async ({ errorStack, error }) => {
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
                modals.showError.make({
                  wind: "root",
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

            convo.on(messages.PrereqsEnded, async () => {
              closePrereqsModal();
            });

            convo.on(
              messages.LaunchWindowShouldBeForeground,
              async ({ hwnd }) => {
                try {
                  require("asfw").SetForegroundWindow(hwnd);
                } catch (e) {
                  logger.warn(`Could not set foreground window: ${e.stack}`);
                }
              }
            );

            convo.on(messages.LaunchRunning, async () => {
              logger.info("Now running!");
              ctx.emitProgress({ progress: 1, stage: "run" });

              if (preferences.preventDisplaySleep) {
                powerSaveBlockerId = powerSaveBlocker.start(
                  "prevent-display-sleep"
                );
              }
            });

            convo.on(messages.LaunchExited, async () => {
              logger.info("Exited!");
              ctx.emitProgress({ progress: -1, stage: "clean" });
            });

            convo.on(messages.AllowSandboxSetup, async () => {
              let messageString: LocalizedString = "";
              let detailString: LocalizedString = "";

              if (process.platform === "win32") {
                messageString = ["sandbox.setup.windows.message"];
                detailString = ["sandbox.setup.windows.detail"];
              } else {
                messageString = ["sandbox.setup.linux.message"];
                detailString = ["sandbox.setup.linux.detail"];
              }

              const res = await promisedModal(
                store,
                modals.sandboxBlessing.make({
                  wind: "root",
                  title: ["sandbox.setup.title"],
                  message: messageString,
                  detail: detailString,
                  widgetParams: {},
                  buttons: [
                    {
                      label: ["sandbox.setup.proceed"],
                      action: modals.sandboxBlessing.action({
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
          }
        );
      } finally {
        closePrereqsModal();
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
