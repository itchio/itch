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
          throw new Error(`no upload picked`);
        }
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

      const res = await client.call(
        messages.Operation.Start({
          id,
          stagingFolder,
          operation: "install",
          installParams: {
            game,
            installFolder: absoluteInstallFolder,
            credentials: buseGameCredentials(credentials),
            upload: item.upload,
            fresh: item.reason === "install",
          },
        })
      );

      logger.info(`butler says operation ended`);
      logger.info(`final install result:\n${JSON.stringify(res, null, 2)}`);
      const ires = res.installResult;

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

      logger.info(`Committing game & cave to db`);
      ctx.db.saveOne("games", game.id, game);
      ctx.db.saveOne("caves", cave.id, cave);
    } finally {
      butlerExited = true;
      instance.cancel();
    }
  });

  await ctx.withStopper({
    work: async () => {
      await instance.promise();
    },
    stop: async () => {
      logger.info(`Asked to stop, cancelling butler process`);
      cancelled = true;
      instance.cancel();
    },
  });

  if (cancelled) {
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
