import { actions } from "../actions";

import asTask from "./tasks/as-task";
import { Watcher } from "./watcher";
import Context from "../context";
import { Logger } from "../logger";

import { DB } from "../db";
import { ICave } from "../db/models/cave";

import * as paths from "../os/paths";
import { currentRuntime } from "../os/runtime";

import lazyGetGame from "./lazy-get-game";
import getGameCredentials from "./downloads/get-game-credentials";

import { IRuntime, isAborted, Cancelled } from "../types";

import { promisedModal } from "./modals";
import { t } from "../format/t";
import { Game } from "ts-itchio-api";
import { modalWidgets, ITypedModal } from "../components/modal-widgets/index";
import { setupClient, buseGameCredentials } from "../util/buse-utils";
import { Instance, messages } from "node-buse";
import pickManifestAction from "./launch/pick-manifest-action";
import { performHTMLLaunch } from "./launch/html";
import { shell } from "electron";
import { PrereqStatus } from "node-buse/lib/messages";
import { IPrereqsStateParams } from "../components/modal-widgets/prereqs-state";

export default function(watcher: Watcher, db: DB) {
  watcher.on(actions.queueLaunch, async (store, action) => {
    const { caveId } = action.payload;

    const cave = db.caves.findOneById(caveId);
    if (!cave) {
      throw new Error("no such cave");
    }

    const runtime = currentRuntime();

    let game: Game;

    asTask({
      name: "launch",
      gameId: cave.gameId,
      store,
      db,
      work: async (ctx, logger) => {
        game = await lazyGetGame(ctx, cave.gameId);
        if (!game) {
          throw new Error("no such game");
        }

        return await doLaunch(ctx, logger, cave, game, runtime);
      },
      onError: async (e: any, log) => {
        if (isAborted(e)) {
          // just ignore it then
          return;
        }

        let title = game ? game.title : "<missing game>";
        const i18n = store.getState().i18n;

        let errorMessage = String(e);
        if (e.reason) {
          if (Array.isArray(e.reason)) {
            errorMessage = t(i18n, e.reason);
          } else {
            errorMessage = String(e.reason);
          }
        } else {
          // only show first line
          errorMessage = errorMessage.split("\n")[0];
        }

        await promisedModal(
          store,
          modalWidgets.showError.make({
            title: ["game.install.could_not_launch", { title }],
            message: [
              "game.install.could_not_launch.message",
              { title, errorMessage },
            ],
            detail: ["game.install.could_not_launch.detail"],
            widgetParams: {
              errorStack: e.stack,
              log,
            },
            buttons: [
              {
                label: ["prompt.action.ok"],
              },
              "cancel",
            ],
          })
        );
      },
    });
  });
}

async function doLaunch(
  ctx: Context,
  logger: Logger,
  cave: ICave,
  game: Game,
  runtime: IRuntime
) {
  const { store } = ctx;

  if (cave.morphing) {
    store.dispatch(
      actions.statusMessage({
        message: ["status.repairing_game", { title: game.title }],
      })
    );

    const { upload, build } = cave;
    store.dispatch(
      actions.queueDownload({
        caveId: cave.id,
        game,
        reason: "heal",
        upload,
        build,
      })
    );
    return;
  }

  const { appVersion } = store.getState().system;
  logger.info(`itch ${appVersion} launching '${game.title}' (#${game.id})`);

  const credentials = getGameCredentials(ctx, game);
  if (!credentials) {
    throw new Error(`no game credentials, can't launch`);
  }

  const { preferences } = store.getState();
  const appPath = paths.appPath(cave, preferences);
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

  const instance = new Instance();
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
        const errorMessage = error;

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
              log: "(empty)", // TODO: fill ?
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

      await client.call(
        messages.Launch({
          installFolder: appPath,
          game,
          upload: cave.upload,
          build: cave.build,
          verdict: cave.verdict,

          prereqsDir,

          sandbox: preferences.isolateApps,

          credentials: buseGameCredentials(credentials),
        })
      );
    } finally {
      closePrereqsModal();
      instance.cancel();
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

  // let manifestAction: IManifestAction;
  // const manifest = await getManifest(store, cave, logger);

  // if (manifest) {
  //   manifestAction = await pickManifestAction(store, manifest, game);
  //   if (!manifestAction) {
  //     logger.info(`No manifest action picked, cancelling`);
  //     return;
  //   }
  // }

  // let launchType = "native";

  // if (manifestAction) {
  //   launchType = await launchTypeForAction(ctx, appPath, manifestAction.path);

  //   if (manifestAction.scope) {
  //     logger.info(`Requesting subkey with scope: ${manifestAction.scope}`);
  //     const gameCredentials = getGameCredentials(ctx, game);
  //     if (gameCredentials) {
  //       const client = api.withKey(gameCredentials.apiKey);
  //       const subkey = await client.subkey(game.id, manifestAction.scope);
  //       logger.info(
  //         `Got subkey (${subkey.key.length} chars, expires ${subkey.expiresAt})`
  //       );
  //       (env as any).ITCHIO_API_KEY = subkey.key;
  //       (env as any).ITCHIO_API_KEY_EXPIRES_AT = subkey.expiresAt;
  //     } else {
  //       logger.error(`No credentials, cannot request API key to give to game`);
  //     }
  //   }

  //   args = [...args, ...(manifestAction.args || emptyArr)];
  // }

  // const launcher = launchers[launchType];
  // if (!launcher) {
  //   throw new Error(`Unsupported launch type '${launchType}'`);
  // }

  // const prepare = prepares[launchType];
  // if (prepare) {
  //   logger.info(`launching prepare for ${launchType}`);
  //   await prepare(ctx, {
  //     manifest,
  //     manifestAction,
  //     args,
  //     cave,
  //     env,
  //     game,
  //     logger,
  //     runtime,
  //   });
  // } else {
  //   logger.info(`no prepare for ${launchType}`);
  // }

  // const startedAt = new Date();
  // db.saveOne("caves", cave.id, { lastTouchedAt: startedAt });

  // let interval: NodeJS.Timer;
  // const UPDATE_PLAYTIME_INTERVAL = 10; // in seconds
  // let powerSaveBlockerId = null;
  // try {
  //   // FIXME: this belongs in a watcher reactor or something, not here.
  //   interval = setInterval(async () => {
  //     const now = new Date();
  //     const freshCave = db.caves.findOneById(cave.id);
  //     const previousSecondsRun = freshCave ? freshCave.secondsRun || 0 : 0;
  //     const newSecondsRun = UPDATE_PLAYTIME_INTERVAL + previousSecondsRun;
  //     db.saveOne("caves", cave.id, {
  //       secondsRun: newSecondsRun,
  //       lastTouched: now,
  //     });
  //   }, UPDATE_PLAYTIME_INTERVAL * 1000);

  //   // FIXME: this belongs in a watcher reactor too
  //   if (preferences.preventDisplaySleep) {
  //     powerSaveBlockerId = powerSaveBlocker.start("prevent-display-sleep");
  //   }

  //   ctx.emitProgress({ progress: 1 });
  //   await launcher(ctx, {
  //     cave,
  //     game,
  //     args,
  //     env,
  //     manifestAction,
  //     manifest,
  //     logger,
  //     runtime,
  //   });
  // } catch (e) {
  //   if (isCancelled(e)) {
  //     // all good then
  //     return;
  //   }
  //   logger.error(`Fatal error: ${e.message || String(e)}`);

  //   // FIXME: don't use instanceof ever
  //   if (e instanceof Crash) {
  //     const secondsRunning = (Date.now() - +startedAt) / 1000;
  //     if (secondsRunning > 2) {
  //       // looks like the game actually launched fine!
  //       logger.warn(
  //         `Game was running for ${secondsRunning} seconds, ignoring: ${e.toString()}`
  //       );
  //       return;
  //     }
  //   }

  //   throw e;
  // } finally {
  //   clearInterval(interval);
  //   if (powerSaveBlockerId) {
  //     powerSaveBlocker.stop(powerSaveBlockerId);
  //   }
  //   db.saveOne("caves", cave.id, { lastTouchedAt: new Date() });
  // }
}
