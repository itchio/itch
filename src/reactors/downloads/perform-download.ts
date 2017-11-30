import * as paths from "../../os/paths";
import * as sf from "../../os/sf";

import rootLogger from "../../logger";

import getGameCredentials from "./get-game-credentials";

import { IDownloadItem, IDownloadResult, currentRuntime } from "../../types";
import Context from "../../context";
import { Instance, messages } from "node-buse";
import { ICave, ICaveLocation } from "../../db/models/cave";

import configure from "../launch/configure";
import { promisedModal } from "../modals";

import * as actions from "../../actions";
import makeUploadButton from "../make-upload-button";

import { map } from "underscore";
import { MODAL_RESPONSE } from "../../constants/action-types";
import { buseGameCredentials } from "../../util/buse-utils";

export default async function performDownload(
  ctx: Context,
  item: IDownloadItem
): Promise<IDownloadResult> {
  // TODO: we want to store download/install logs even if the cave never ends
  // up being valid, for bug reporting purposes.

  let parentLogger = rootLogger;
  let caveIn: ICave;
  if (item.caveId) {
    parentLogger = paths.caveLogger(item.caveId);
    caveIn = ctx.db.caves.findOneById(item.caveId);
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

  let caveLocation: ICaveLocation = caveIn
    ? caveIn
    : {
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

        client.onRequest(messages.PickUpload, async ({ params }) => {
          const { uploads } = params;
          const { title } = game;

          const modalRes = await promisedModal(ctx.store, {
            title: ["pick_install_upload.title", { title }],
            message: ["pick_install_upload.message", { title }],
            detail: ["pick_install_upload.detail"],
            bigButtons: map(uploads, (candidate, index) => {
              return {
                ...makeUploadButton(candidate),
                action: actions.modalResponse({
                  pickedUploadIndex: index,
                }),
              };
            }),
            buttons: ["cancel"],
          });

          if (modalRes.type === MODAL_RESPONSE) {
            return { index: modalRes.payload.pickedUploadIndex };
          } else {
            throw new Error(`no upload picked`);
          }
        });

        const res = await client.call(
          messages.Operation.Start({
            stagingFolder,
            operation: "install",
            installParams: {
              game,
              installFolder: absoluteInstallFolder,
              credentials: buseGameCredentials(credentials),
              upload: item.upload,
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
