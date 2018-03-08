import rootLogger from "../../logger";
const logger = rootLogger.child({ name: "perform-download" });

import { IDownloadItem, Cancelled } from "../../types";
import Context from "../../context";

import { actions } from "../../actions";

import { messages, setupClient, makeButlerInstance } from "../../buse/index";

export default async function performDownload(
  ctx: Context,
  item: IDownloadItem
): Promise<void> {
  const { stagingFolder } = item;

  let butlerExited = false;
  let cancelled = false;

  const instance = await makeButlerInstance();
  instance.onClient(async client => {
    try {
      setupClient(client, logger, ctx);

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
            `Asking butler to cancel with a ${(
              deadline / 1000
            ).toFixed()}s deadline`
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

          await client.call(messages.InstallCancel({ id }));
        })().catch(e => {
          logger.warn(`While discarding: ${e.stack}`);
        });
      });

      await client.call(messages.InstallPerform({ id, stagingFolder }));
      logger.debug(`returned from Install.Perform`);
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
}
