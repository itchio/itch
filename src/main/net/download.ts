import { isEmpty } from "underscore";
import { dirname } from "path";
import progress from "progress-stream";

import * as sf from "../os/sf";
import { fileSize } from "common/format/filesize";
import { Logger } from "common/logger";
import { request } from "./request";
import { ProgressInfo } from "common/types";

/**
 * Download to file without using butler
 */
export async function downloadToFile(
  onProgress: (progress: ProgressInfo) => void,
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

  let progressStream: NodeJS.ReadWriteStream;
  await request(
    "get",
    url,
    {},
    {
      sink: () => {
        progressStream = progress({ length: totalSize, time: 500 });
        progressStream.on("progress", info => {
          onProgress({
            progress: info.percentage / 100,
            eta: info.eta,
            bps: info.speed,
            doneBytes: (info.percentage / 100) * totalSize,
            totalBytes: totalSize,
          });
          logger.info(
            `${info.percentage.toFixed(1)}% done, eta ${info.eta.toFixed(
              1
            )}s @ ${fileSize(info.speed)}/s`
          );
        });
        progressStream.pipe(fileSink);
        return progressStream;
      },
      cb: res => {
        logger.info(`HTTP ${res.statusCode} ${url}`);
        if (!/^2/.test("" + res.statusCode)) {
          throw new Error(`HTTP ${res.statusCode} ${url}`);
        }

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
    `Downloaded ${fileSize(stats.size)} / ${fileSize(totalSize)} (${
      stats.size
    } bytes)`
  );

  if (totalSize !== 0 && stats.size !== totalSize) {
    throw new Error(`download failed (short size) for ${url}`);
  }
}
