
import {EventEmitter} from "events";

import db from "../db";

import Game from "../db/models/game";
import Cave from "../db/models/cave";

import lazyGetGame from "../reactors/lazy-get-game";
import getGameCredentials from "../reactors/downloads/get-game-credentials";

import nativePrepare from "./prepare/native";

import nativeLaunch from "./launch/native";
import htmlLaunch from "./launch/html";
import shellLaunch from "./launch/shell";
import externalLaunch from "./launch/external";

import getManifest from "./launch/get-manifest";
import pickManifestAction from "./launch/pick-manifest-action";
import launchTypeForAction from "./launch/launch-type-for-action";
import notifyCrash from "./launch/notify-crash";

import store from "../store/metal-store";

import {app, powerSaveBlocker} from "electron";

import api from "../api";
import * as paths from "../os/paths";

import {Logger} from "../logger";

import actionForGame from "../util/action-for-game";

import {each} from "underscore";

import {Crash, Cancelled} from "./errors";

const emptyObj = {} as any;

import {
  ILaunchers,
  IPrepares,
} from "./launch/types";

import {
  IQueueLaunchOpts,
  IManifestAction, IEnvironment,
} from "../types";

export default async function launch (out: EventEmitter, opts: IQueueLaunchOpts) {
  const logger = paths.caveLogger(opts.caveId).child({name: "launch"});

  const cave = await db.caves.findOneById(opts.caveId);
  if (!cave) {
    throw new Error("no such cave");
  }

  const game = await lazyGetGame(store, cave.gameId);
  if (!game) {
    throw new Error("no such game");
  }

  try {
    return await doLaunch(out, opts, logger, cave, game);
  } catch (e) {
    await notifyCrash(game, e, logger);
  } finally {
    logger.close();
  }
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

async function doLaunch (
      out: EventEmitter, opts: IQueueLaunchOpts, logger: Logger,
      cave: Cave, game: Game) {

  let env: IEnvironment = {};
  let args: string[] = [];

  const action = actionForGame(game, cave);
  if (action === "open") {
    await db.saveOne("caves", cave.id, {lastTouched: Date.now()});
    shellLaunch(out, {
      hasManifest: false,
      cave,
      game,
      args,
      env,
      logger,
    });
    return;
  }

  logger.info(`itch ${app.getVersion()} launching game ${game.id}: ${game.title}`);

  const {preferences} = store.getState();
  const appPath = paths.appPath(cave, preferences);

  let manifestAction: IManifestAction;
  const manifest = await getManifest(store, cave, logger);

  if (manifest) {
    manifestAction = await pickManifestAction(store, manifest, game);
  }

  let {launchType} = cave;

  if (manifestAction) {
    launchType = await launchTypeForAction(appPath, manifestAction.path);

    if (manifestAction.scope) {
      logger.info(`Requesting subkey with scope: ${manifestAction.scope}`);
      const gameCredentials = await getGameCredentials(store, game);
      if (gameCredentials) {
        const client = api.withKey(gameCredentials.apiKey);
        const subkey = await client.subkey(game.id, manifestAction.scope);
        logger.info(`Got subkey (${subkey.key.length} chars, expires ${subkey.expiresAt})`);
        (env as any).ITCHIO_API_KEY = subkey.key;
        (env as any).ITCHIO_API_KEY_EXPIRES_AT = subkey.expiresAt;
      } else {
        logger.error(`No credentials, cannot request API key to give to game`);
      }
    }

    if (manifestAction.args) {
      each(manifestAction.args, (arg) => {
        args.push(arg);
      });
    }
  }

  const launcher = launchers[launchType];
  if (!launcher) {
    throw new Error(`Unsupported launch type '${cave.launchType}'`);
  }

  const prepare = prepares[launchType];
  if (prepare) {
    logger.info(`launching prepare for ${launchType}`);
    await prepare(out, {manifest});
  } else {
    logger.info(`no prepare for ${launchType}`);
  }

  const startedAt = Date.now();
  await db.saveOne("caves", cave.id, {lastTouched: startedAt});

  let interval: NodeJS.Timer;
  const UPDATE_PLAYTIME_INTERVAL = 10; // in seconds
  let powerSaveBlockerId = null;
  try {
    // FIXME: this belongs in a watcher reactor or something, not here.
    interval = setInterval(async () => {
      const now = Date.now();
      const previousSecondsRun = (await db.caves.findOneById(cave.id) || emptyObj).secondsRun || 0;
      const newSecondsRun = UPDATE_PLAYTIME_INTERVAL + previousSecondsRun;
      await db.saveOne("caves", cave.id, {secondsRun: newSecondsRun, lastTouched: now});
    }, UPDATE_PLAYTIME_INTERVAL * 1000);

    // FIXME: this belongs in a watcher reactor too
    if (preferences.preventDisplaySleep) {
      powerSaveBlockerId = powerSaveBlocker.start("prevent-display-sleep");
    }

    await launcher(store, out, {
      cave,
      game,
      args,
      env,
      manifestAction,
      hasManifest: !!manifest,
      logger,
    });
  } catch (e) {
    logger.error(`error while launching ${cave.id}: ${e.message || e}`);
    if (e instanceof Crash) {
      const secondsRunning = (Date.now() - startedAt) / 1000;
      if (secondsRunning > 2) {
        // looks like the game actually launched fine!
        logger.warn(`Game was running for ${secondsRunning} seconds, ignoring: ${e.toString()}`);
        return;
      }
    }

    if (e instanceof Cancelled) {
      // all good then
      return;
    }

    throw e;
  } finally {
    clearInterval(interval);
    if (powerSaveBlockerId) {
      powerSaveBlocker.stop(powerSaveBlockerId);
    }
    await db.saveOne("caves", cave.id, {lastTouched: Date.now()});
  }
}
