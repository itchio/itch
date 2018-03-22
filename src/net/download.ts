import { isEmpty } from "underscore";
import { dirname } from "path";
import * as progress from "progress-stream";

import * as sf from "../os/sf";
import { fileSize } from "../format/filesize";
import { Logger } from "../logger";
import { request } from "./request";
import { WriteStream } from "fs";
import { MinimalContext } from "../context";

/**
 * Download to file without using butler
 */
export async function downloadToFile(
  ctx: MinimalContext,
  logger: Logger,
  url: string,
  file: string
) {
  const dir = dirname(file);
  try {
    await sf.mkdirp(dir);
  } catch (e) {
    logger.error(`Could not create ${dir}: ${e.message}`);
  }

  const fileSink = sf.createWriteStream(file, {
    flags: "w",
    mode: 0o777,
    defaultEncoding: "binary",
  });

  let totalSize = 0;

  let progressStream: WriteStream;
  await request(
    "get",
    url,
    {},
    {
      sink: () => {
        progressStream = progress({ length: totalSize, time: 500 });
        progressStream.on("progress", progress => {
          ctx.emitProgress({
            progress: progress.percentage / 100,
            eta: progress.eta,
            bps: progress.speed,
            totalBytes: totalSize,
          });
          logger.info(
            `${progress.percentage.toFixed(
              1
            )}% done, eta ${progress.eta.toFixed(1)}s @ ${fileSize(
              progress.speed
            )}/s`
          );
        });
        progressStream.pipe(fileSink);
        return progressStream;
      },
      cb: res => {
        const contentLengthHeader = res.headers["content-length"];
        if (!isEmpty(contentLengthHeader)) {
          totalSize = parseInt(contentLengthHeader[0], 10);
        }
      },
    }
  );
  await sf.promised(fileSink);

  const stats = await sf.lstat(file);
  logger.info(
    `downloaded ${fileSize(stats.size)} / ${fileSize(totalSize)} (${
      stats.size
    } bytes)`
  );

  if (totalSize !== 0 && stats.size !== totalSize) {
    throw new Error(`download failed (short size) for ${url}`);
  }
}
