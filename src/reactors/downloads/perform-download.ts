import * as paths from "../../os/paths";
import * as sf from "../../os/sf";
import urls from "../../constants/urls";

import rootLogger from "../../logger";

import getGameCredentials from "./get-game-credentials";

import { IDownloadItem, IDownloadResult, currentRuntime } from "../../types";
import Context from "../../context";
import { Instance, messages } from "node-buse";
import { ICave, ICaveLocation } from "../../db/models/cave";

import configure from "../launch/configure";

export default async function performDownload(
  ctx: Context,
  item: IDownloadItem
): Promise<IDownloadResult> {
  // TODO: we want to store download/install logs even if the cave never ends
  // up being valid, for bug reporting purposes.

  let parentLogger = rootLogger;
  if (item.caveId) {
    parentLogger = paths.caveLogger(item.caveId);
  }
  const logger = parentLogger.child({ name: `download` });

  const { game, caveId, installLocation, installFolder } = item;
  const { preferences } = ctx.store.getState();

  const stagingFolder = paths.downloadFolderPathForId(item.id, preferences);

  if (await sf.exists(stagingFolder)) {
    logger.info(`Resuming!`);
  }

  const credentials = await getGameCredentials(ctx, item.game);
  if (!credentials) {
    throw new Error(`no game credentials, can't download`);
  }

  const caveLocation: ICaveLocation = {
    id: caveId,
    installFolder,
    installLocation,
    pathScheme: paths.PathScheme.MODERN_SHARED,
  };
  const absoluteInstallFolder = paths.appPath(caveLocation, preferences);

  let cave: ICave;

  if (!!true) {
    const instance = new Instance();
    instance.onClient(async client => {
      try {
        client.onNotification(messages.Operation.Progress, ({ params }) => {
          ctx.emitProgress(params);
        });

        client.onNotification(messages.Log, ({ params }) => {
          switch (params.level) {
            case "debug":
              logger.debug(`[butler] ${params.message}`);
              break;
            case "info":
              logger.info(`[butler] ${params.message}`);
              break;
            case "warn":
              logger.warn(`[butler] ${params.message}`);
              break;
            case "error":
              logger.error(`[butler] ${params.message}`);
              break;
            default:
              logger.info(`[butler ${params.level}] ${params.message}`);
              break;
          }
        });

        client.onNotification(messages.TaskStarted, ({ params }) => {
          logger.info(
            `butler says task ${params.type} started (for ${params.reason})`
          );
        });

        client.onNotification(messages.TaskEnded, ({ params }) => {
          logger.info(`butler says task ended`);
        });

        const res = await client.call(
          messages.Operation.Start({
            stagingFolder,
            operation: "install",
            installParams: {
              game,
              installFolder: absoluteInstallFolder,
              credentials: {
                apiKey: credentials.apiKey,
                downloadKey: credentials.downloadKey
                  ? credentials.downloadKey.id
                  : null,
                server: urls.itchioApi,
              },
            },
          })
        );

        logger.info(`final install result:\n${JSON.stringify(res, null, 2)}`);
        const ires = res.installResult;

        cave = {
          ...caveLocation,
          gameId: game.id,

          installedAt: new Date(),
          channelName: ires.upload.channelName,
          build: ires.build,
          upload: ires.upload,
          handPicked: false, // TODO: butler should let us know if it was handpicked in the result
        };

        logger.info(`Committing game & cave to db`);
        ctx.db.saveOne("games", game.id, game);
        ctx.db.saveOne("caves", cave.id, cave);
      } finally {
        instance.cancel();
      }
    });

    await ctx.withStopper({
      work: async () => {
        await instance.promise();
      },
      stop: async () => {
        instance.cancel();
      },
    });

    // TODO: move to buse
    logger.info(`Configuring...`);
    await configure(ctx, {
      game,
      cave,
      logger,
      runtime: currentRuntime(),
    });
  }

  return {
    archivePath: null,
  };
}

/**
 * Mark cave as morphing, do `cb`, then clear the morphing marker
 * if it succeeded.
 */
// TODO: use for everything but first installs
export async function doMorphingOperation<T>(
  ctx: Context,
  caveId: string,
  cb: () => Promise<T>
): Promise<T> {
  ctx.db.saveOne("caves", caveId, { morphing: true });
  const res = await cb();
  // if cb throws, we'll never reach here
  ctx.db.saveOne("caves", caveId, { morphing: false });
  return res;
}
