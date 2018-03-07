import { actions } from "../../actions";

import Context from "../../context";
import { Logger } from "../../logger";

import * as paths from "../../os/paths";

import { IRuntime, Cancelled, ILocalizedString } from "../../types";

import { promisedModal } from "../modals";
import {
  modalWidgets,
  ITypedModal,
} from "../../components/modal-widgets/index";
import { messages, setupClient, makeButlerInstance } from "../../buse/index";
import { shell, powerSaveBlocker } from "electron";
import { Game, PrereqStatus, Cave } from "../../buse/messages";
import { IPrereqsStateParams } from "../../components/modal-widgets/prereqs-state";

import { pickManifestAction } from "./pick-manifest-action";
import { performHTMLLaunch } from "./perform-html-launch";

export async function performLaunch(
  ctx: Context,
  logger: Logger,
  cave: Cave,
  game: Game,
  runtime: IRuntime
) {
  const { store } = ctx;

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
        id: prereqsModal.id,
      })
    );
    prereqsModal = null;
  }

  let powerSaveBlockerId = null;

  const instance = await makeButlerInstance();
  let cancelled = false;
  instance.onClient(async client => {
    try {
      setupClient(client, logger, ctx);

      client.onRequest(messages.PickManifestAction, async ({ params }) => {
        const name = await pickManifestAction(store, params.actions, game);
        return { name };
      });

      client.onRequest(messages.HTMLLaunch, async ({ params }) => {
        return await performHTMLLaunch({
          ctx,
          logger,
          game,
          params,
        });
      });

      client.onRequest(messages.ShellLaunch, async ({ params }) => {
        shell.openItem(params.itemPath);
        return {};
      });

      client.onRequest(messages.URLLaunch, async ({ params }) => {
        store.dispatch(actions.navigate({ url: params.url }));
        return {};
      });

      client.onNotification(messages.PrereqsStarted, async ({ params }) => {
        prereqsStateParams = {
          gameTitle: game.title,
          tasks: {},
        };

        const {} = params;
        for (const name of Object.keys(params.tasks)) {
          const task = params.tasks[name];
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

      client.onNotification(messages.PrereqsTaskState, async ({ params }) => {
        if (!prereqsModal) {
          return;
        }

        const { name, status, progress, eta, bps } = params;

        let state = {
          ...prereqsStateParams.tasks[name],
          status,
          progress,
          eta,
          bps,
        };

        let tasks = {
          ...prereqsStateParams.tasks,
          [params.name]: state,
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
      });

      client.onRequest(messages.PrereqsFailed, async ({ params }) => {
        closePrereqsModal();

        const { title } = game;
        const { errorStack, error } = params;
        let errorMessage = error;
        errorMessage = errorMessage.split("\n")[0];

        let log = "(empty)\n";
        if (logger.customOut && logger.customOut.toString) {
          log = logger.customOut.toString();
        }

        const res = await promisedModal(
          store,
          modalWidgets.showError.make({
            title: ["game.install.could_not_launch", { title }],
            message: [
              "game.install.could_not_launch.message",
              { title, errorMessage },
            ],
            detail: ["game.install.could_not_launch.detail"],
            widgetParams: {
              errorStack,
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

      client.onNotification(messages.PrereqsEnded, async ({ params }) => {
        closePrereqsModal();
      });

      client.onNotification(messages.LaunchRunning, async ({ params }) => {
        logger.info("Now running!");

        if (preferences.preventDisplaySleep) {
          powerSaveBlockerId = powerSaveBlocker.start("prevent-display-sleep");
        }
      });

      client.onNotification(messages.LaunchExited, async ({ params }) => {
        logger.info("Exited!");
      });

      client.onRequest(messages.AllowSandboxSetup, async ({ params }) => {
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

      await client.call(
        messages.Launch({
          caveId: cave.id,
          prereqsDir,
          sandbox: preferences.isolateApps,
        })
      );
    } finally {
      closePrereqsModal();
      instance.cancel();
      if (powerSaveBlockerId) {
        powerSaveBlocker.stop(powerSaveBlockerId);
      }
    }
  });

  await ctx.withStopper({
    work: async () => {
      await instance.promise();
    },
    stop: async () => {
      logger.debug(`Asked to stop, cancelling butler process`);
      cancelled = true;
      instance.cancel();
    },
  });

  if (cancelled) {
    logger.debug(`throwing cancelled`);
    throw new Cancelled();
  }
}
