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

import api from "../api";

import nativePrepare from "./prepare/native";

import nativeLaunch from "./launch/native";
import htmlLaunch from "./launch/html";
import shellLaunch from "./launch/shell";
import externalLaunch from "./launch/external";

import getManifest from "./launch/get-manifest";
import pickManifestAction from "./launch/pick-manifest-action";
import launchTypeForAction from "./launch/launch-type-for-action";

import actionForGame from "../util/action-for-game";

import { ILaunchers, IPrepares } from "./launch/types";
import {
  IEnvironment,
  Crash,
  IManifestAction,
  IRuntime,
  isCancelled,
} from "../types";

import { powerSaveBlocker } from "electron";
import { promisedModal } from "./modals";
import { t } from "../format/t";
import { Game } from "ts-itchio-api";

const emptyArr = [];

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
        let title = game ? game.title : "<missing game>";
        const i18n = store.getState().i18n;

        let errorMessage = String(e);
        if (e.reason) {
          if (Array.isArray(e.reason)) {
            errorMessage = t(i18n, e.reason);
          } else {
            errorMessage = String(e.reason);
          }
        }

        await promisedModal(store, {
          title: ["game.install.could_not_launch", { title }],
          message: [
            "game.install.could_not_launch.message",
            { title, errorMessage },
          ],
          detail: ["game.install.could_not_launch.detail"],
          widget: "show-error",
          widgetParams: {
            errorStack: e.stack,
            log,
          },
          buttons: [
            {
              label: ["prompt.action.ok"],
              action: actions.modalResponse({}),
            },
            "cancel",
          ],
        });
      },
    });
  });
}

const launchers = {
  native: nativeLaunch,
  html: htmlLaunch,
  shell: shellLaunch,
  external: externalLaunch,
} as ILaunchers;

const prepares = {
  native: nativePrepare,
} as IPrepares;

async function doLaunch(
  ctx: Context,
  logger: Logger,
  cave: ICave,
  game: Game,
  runtime: IRuntime
) {
  let env: IEnvironment = {};
  let args: string[] = [];

  const { db, store } = ctx;

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

  const action = actionForGame(game, cave);
  if (action === "open") {
    db.saveOne("caves", cave.id, { lastTouchedAt: new Date() });
    shellLaunch(ctx, {
      manifest: null,
      cave,
      game,
      args,
      env,
      logger,
      runtime,
    });
    return;
  }

  const { appVersion } = store.getState().system;
  logger.info(`itch ${appVersion} launching '${game.title}' (#${game.id})`);

  const { preferences } = store.getState();
  const appPath = paths.appPath(cave, preferences);

  let manifestAction: IManifestAction;
  const manifest = await getManifest(store, cave, logger);

  if (manifest) {
    manifestAction = await pickManifestAction(store, manifest, game);
    if (!manifestAction) {
      logger.info(`No manifest action picked, cancelling`);
      return;
    }
  }

  let launchType = "native";

  if (manifestAction) {
    launchType = await launchTypeForAction(ctx, appPath, manifestAction.path);

    if (manifestAction.scope) {
      logger.info(`Requesting subkey with scope: ${manifestAction.scope}`);
      const gameCredentials = await getGameCredentials(ctx, game);
      if (gameCredentials) {
        const client = api.withKey(gameCredentials.apiKey);
        const subkey = await client.subkey(game.id, manifestAction.scope);
        logger.info(
          `Got subkey (${subkey.key.length} chars, expires ${subkey.expiresAt})`
        );
        (env as any).ITCHIO_API_KEY = subkey.key;
        (env as any).ITCHIO_API_KEY_EXPIRES_AT = subkey.expiresAt;
      } else {
        logger.error(`No credentials, cannot request API key to give to game`);
      }
    }

    args = [...args, ...(manifestAction.args || emptyArr)];
  }

  const launcher = launchers[launchType];
  if (!launcher) {
    throw new Error(`Unsupported launch type '${launchType}'`);
  }

  const prepare = prepares[launchType];
  if (prepare) {
    logger.info(`launching prepare for ${launchType}`);
    await prepare(ctx, {
      manifest,
      manifestAction,
      args,
      cave,
      env,
      game,
      logger,
      runtime,
    });
  } else {
    logger.info(`no prepare for ${launchType}`);
  }

  const startedAt = new Date();
  db.saveOne("caves", cave.id, { lastTouchedAt: startedAt });

  let interval: NodeJS.Timer;
  const UPDATE_PLAYTIME_INTERVAL = 10; // in seconds
  let powerSaveBlockerId = null;
  try {
    // FIXME: this belongs in a watcher reactor or something, not here.
    interval = setInterval(async () => {
      const now = new Date();
      const freshCave = db.caves.findOneById(cave.id);
      const previousSecondsRun = freshCave ? freshCave.secondsRun || 0 : 0;
      const newSecondsRun = UPDATE_PLAYTIME_INTERVAL + previousSecondsRun;
      db.saveOne("caves", cave.id, {
        secondsRun: newSecondsRun,
        lastTouched: now,
      });
    }, UPDATE_PLAYTIME_INTERVAL * 1000);

    // FIXME: this belongs in a watcher reactor too
    if (preferences.preventDisplaySleep) {
      powerSaveBlockerId = powerSaveBlocker.start("prevent-display-sleep");
    }

    ctx.emitProgress({ progress: 1 });
    await launcher(ctx, {
      cave,
      game,
      args,
      env,
      manifestAction,
      manifest,
      logger,
      runtime,
    });
  } catch (e) {
    if (isCancelled(e)) {
      // all good then
      return;
    }
    logger.error(`Fatal error: ${e.message || String(e)}`);

    // FIXME: don't use instanceof ever
    if (e instanceof Crash) {
      const secondsRunning = (Date.now() - +startedAt) / 1000;
      if (secondsRunning > 2) {
        // looks like the game actually launched fine!
        logger.warn(
          `Game was running for ${secondsRunning} seconds, ignoring: ${e.toString()}`
        );
        return;
      }
    }

    throw e;
  } finally {
    clearInterval(interval);
    if (powerSaveBlockerId) {
      powerSaveBlocker.stop(powerSaveBlockerId);
    }
    db.saveOne("caves", cave.id, { lastTouchedAt: new Date() });
  }
}
