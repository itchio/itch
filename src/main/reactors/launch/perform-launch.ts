import { actions } from "common/actions";
import { messages, hookLogging } from "common/butlerd";
import { Cave, Game, PrereqStatus } from "common/butlerd/messages";
import { Logger, RecordingLogger } from "common/logger";
import { modals, TypedModal } from "common/modals";
import { PrereqsStateParams } from "common/modals/types";
import { Cancelled, LocalizedString } from "common/types";
import * as paths from "common/util/paths";
import { powerSaveBlocker, shell } from "electron";
import { Context } from "main/context";
import { promisedModal } from "main/reactors/modals";
import { performHTMLLaunch } from "main/reactors/launch/perform-html-launch";
import { pickManifestAction } from "main/reactors/launch/pick-manifest-action";
import { mcall } from "main/butlerd/mcall";
import { Conversation } from "butlerd";

export async function performLaunch(
  ctx: Context,
  logger: RecordingLogger,
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

  let cancelled = false;
  let launchConvo: Conversation;
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
          (convo) => {
            launchConvo = convo;
            hookLogging(convo, logger);

            convo.onRequest(
              messages.PickManifestAction,
              async ({ actions }) => {
                const index = await pickManifestAction(store, actions, game);
                return { index };
              }
            );

            convo.onRequest(messages.AcceptLicense, async ({ text }) => {
              const res = await promisedModal(
                store,
                modals.naked.make({
                  wind: "root",
                  title: ["prompt.sla.title"],
                  message: ["prompt.sla.message"],
                  detail: text,
                  widgetParams: {} as any,
                  buttons: [
                    {
                      label: ["prompt.sla.accept"],
                      action: actions.modalResponse({}),
                    },
                    "cancel",
                  ],
                })
              );

              if (res) {
                return { accept: true };
              }
              return { accept: false };
            });

            convo.onRequest(messages.HTMLLaunch, async (params) => {
              return await performHTMLLaunch({
                ctx,
                logger,
                game,
                params,
              });
            });

            convo.onRequest(messages.ShellLaunch, async ({ itemPath }) => {
              shell.openPath(itemPath);
              return {};
            });

            convo.onRequest(messages.URLLaunch, async ({ url }) => {
              store.dispatch(actions.navigate({ wind: "root", url }));
              return {};
            });

            convo.onNotification(messages.PrereqsStarted, async ({ tasks }) => {
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

            convo.onNotification(
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

            convo.onRequest(
              messages.PrereqsFailed,
              async ({ errorStack, error }) => {
                closePrereqsModal();

                const { title } = game;
                let errorMessage = error;
                errorMessage = errorMessage.split("\n")[0];

                let log = logger.getLog();

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
              }
            );

            convo.onNotification(messages.PrereqsEnded, async () => {
              closePrereqsModal();
            });

            convo.onNotification(messages.LaunchRunning, async () => {
              logger.info("Now running!");
              ctx.emitProgress({ progress: 1, stage: "run" });

              if (preferences.preventDisplaySleep) {
                powerSaveBlockerId = powerSaveBlocker.start(
                  "prevent-display-sleep"
                );
              }
            });

            convo.onNotification(messages.LaunchExited, async () => {
              logger.info("Exited!");
              ctx.emitProgress({ progress: -1, stage: "clean" });
            });

            convo.onRequest(messages.AllowSandboxSetup, async () => {
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
      if (launchConvo) {
        launchConvo.cancel();
      }
    },
  });

  if (cancelled) {
    logger.debug(`throwing cancelled`);
    throw new Cancelled();
  }
}
