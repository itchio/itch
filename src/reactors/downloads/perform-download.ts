import * as paths from "../../os/paths";
import * as sf from "../../os/sf";

import rootLogger from "../../logger";

import getGameCredentials from "./get-game-credentials";

import {
  IDownloadItem,
  IDownloadResult,
  currentRuntime,
  Cancelled,
} from "../../types";
import Context from "../../context";
import { Instance, messages } from "node-buse";
import { ICave } from "../../db/models/cave";

import configure from "../launch/configure";
import { promisedModal } from "../modals";

import * as actions from "../../actions";
import makeUploadButton from "../make-upload-button";

import { map } from "underscore";
import { MODAL_RESPONSE } from "../../constants/action-types";
import { buseGameCredentials, setupClient } from "../../util/buse-utils";
import { computeCaveLocation } from "./compute-cave-location";
import { readReceipt } from "../../install-managers/common/receipt";

export default async function performDownload(
  ctx: Context,
  item: IDownloadItem
): Promise<IDownloadResult> {
  let parentLogger = rootLogger;
  let caveIn: ICave;
  if (item.caveId) {
    caveIn = ctx.db.caves.findOneById(item.caveId);
  }
  const logger = parentLogger.child({ name: `download` });

  const { game } = item;
  const { preferences } = ctx.store.getState();

  const credentials = await getGameCredentials(ctx, item.game);
  if (!credentials) {
    throw new Error(`no game credentials, can't download`);
  }

  const { caveLocation, absoluteInstallFolder } = computeCaveLocation(
    item,
    preferences,
    caveIn
  );

  const stagingFolder = paths.downloadFolderPathForId(
    preferences,
    caveLocation.installLocation,
    item.id
  );
  if (await sf.exists(stagingFolder)) {
    logger.info(`Resuming!`);
  }

  let cave: ICave;
  let butlerExited = false;
  let cancelled = false;

  const instance = new Instance();
  instance.onClient(async client => {
    try {
      setupClient(client, logger, ctx);

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
          // that tells butler to abort
          return { index: -1 };
        }
      });

      client.onRequest(messages.GetReceipt, async ({ params }) => {
        logger.info(`butler asked for receipt info`);

        if (!caveIn) {
          logger.info(`no existing cave, returning null receipt`);
          return { receipt: null };
        }

        let files: string[] = [];
        const legacyReceipt = await readReceipt({
          ctx: ctx,
          logger: logger,
          destPath: absoluteInstallFolder,
        });

        if (
          legacyReceipt &&
          legacyReceipt.files &&
          Array.isArray(legacyReceipt.files)
        ) {
          files = legacyReceipt.files;
          logger.info(
            `found legacy receipt! (${legacyReceipt.files.length} files)`
          );
        } else {
          logger.info(`no legacy receipt`);
        }

        return {
          receipt: {
            files,
            upload: caveIn.upload,
            build: caveIn.build,
          },
        };
      });

      client.onNotification(messages.TaskStarted, ({ params }) => {
        const { type, reason } = params;
        logger.info(`Task ${type} started (for ${reason})`);

        ctx.store.dispatch(
          actions.downloadProgress({
            id: item.id,
            upload: params.upload,
            build: params.build,
          })
        );
      });

      client.onNotification(messages.TaskSucceeded, async ({ params }) => {
        logger.info(`Task ${params.type} succeeded`);

        const ires = params.installResult;
        if (ires == null) {
          logger.info(`...no install result, that's fine`);
          return;
        }

        logger.info(`Committing game & cave to db`);
        cave = {
          ...caveLocation,
          gameId: game.id,

          installedAt: new Date(),
          channelName: ires.upload.channelName,
          build: ires.build,
          upload: ires.upload,
          // TODO: butler should let us know if it was handpicked in the result.
          // We can't keep track of it ourselves, because performDownload() might
          // be called many times for the same download
          handPicked: false,
        };

        ctx.db.saveOne("games", game.id, game);
        ctx.db.saveOne("caves", cave.id, cave);
      });

      const id = item.id;

      ctx.on("graceful-cancel", () => {
        (async () => {
          logger.warn(`Received graceful-cancel`);
          cancelled = true;

          if (butlerExited) {
            // nothing to do
            logger.warn(
              `Nothing to do for graceful-cancel, butler already exited`
            );
            return;
          }

          const deadline = 5 * 1000;
          logger.warn(
            `Asking butler to cancel with a ${(deadline /
              1000).toFixed()}s deadline`
          );
          setTimeout(() => {
            if (butlerExited) {
              logger.info(`butler exited gracefully!`);
              return;
            }
            logger.warn(`butler failed to exit within deadline, killing it!`);

            try {
              instance.cancel();
            } catch (e) {
              logger.warn(`While cancelling instance: ${e.stack}`);
            }
          }, deadline);

          await client.call(messages.Operation.Cancel({ id }));
        })().catch(e => {
          logger.warn(`While discarding: ${e.stack}`);
        });
      });

      await client.call(
        messages.Operation.Start({
          id,
          stagingFolder,
          operation: "install",
          installParams: {
            game,
            installFolder: absoluteInstallFolder,
            credentials: buseGameCredentials(credentials),
            upload: item.upload,
            build: item.build,
          },
        })
      );
      logger.debug(`returned from Operation.Start`);
    } finally {
      butlerExited = true;
      logger.debug(`cancelling instance in finally`);
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

  logger.debug(`returned from withStopper await`);

  if (cancelled) {
    logger.debug(`throwing cancelled`);
    throw new Cancelled();
  }

  // TODO: move to buse
  logger.info(`Configuring...`);
  await configure(ctx, {
    game,
    cave,
    logger,
    runtime: currentRuntime(),
  });

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
