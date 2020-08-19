import { dirname } from "path";
import progress from "progress-stream";

import * as sf from "main/os/sf";
import { fileSize } from "common/format/filesize";
import { Logger } from "common/logger";
import { request } from "main/net/request";
import { ProgressInfo } from "common/types";
import { WriteStream, createWriteStream } from "fs";
import { delay } from "main/reactors/delay";
import { isArray } from "util";

interface HTTPError extends Error {
  httpStatusCode: number;
}

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
    await sf.mkdir(dir);
  } catch (e) {
    logger.error(`Could not create ${dir}: ${e.message}`);
  }

  const fileSink = createWriteStream(file, {
    flags: "w",
    mode: 0o777,
    encoding: "binary",
  }) as WriteStream;
  try {
    let totalSize = 0;

    let progressStream: NodeJS.ReadWriteStream;
    let fileSinkPromise = sf.promised(fileSink);
    await request(
      "get",
      url,
      {},
      {
        sink: () => {
          progressStream = progress({ length: totalSize, time: 500 });
          progressStream.on("progress", (info) => {
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
        cb: (res) => {
          logger.info(`HTTP ${res.statusCode} ${url}`);
          if (!/^2/.test("" + res.statusCode)) {
            const e = new Error(`HTTP ${res.statusCode} ${url}`) as HTTPError;
            e.httpStatusCode = res.statusCode;
            throw e;
          }

          let contentLengthHeader: any = res.headers["content-length"];
          if (isArray(contentLengthHeader)) {
            contentLengthHeader = contentLengthHeader[0];
          }
          if (contentLengthHeader) {
            let contentLength: number = parseInt(contentLengthHeader, 10);
            totalSize = contentLength;
          }
        },
      }
    );
    logger.debug(`Awaiting file sink promise`);
    await fileSinkPromise;

    const stats = await sf.lstat(file);
    logger.info(
      `Downloaded ${fileSize(stats.size)} / ${fileSize(totalSize)} (${
        stats.size
      } bytes)`
    );

    if (totalSize !== 0 && stats.size !== totalSize) {
      throw new Error(`download failed (short size) for ${url}`);
    }
  } finally {
    fileSink.end();
  }
}

// cf. https://github.com/itchio/httpkit/blob/50f60be27c88c7d8a3cdc01ea2029d465a830ceb/htfs/file.go
let httpStatusesThatWarrantARetry = [
  429 /* Too Many Requests */,
  500 /* Internal Server Error */,
  502 /* Bad Gateway */,
  503 /* Service Unavailable */,
];

export async function downloadToFileWithRetry(
  onProgress: (progress: ProgressInfo) => void,
  logger: Logger,
  url: string,
  file: string
) {
  let tries = 0;
  const maxTries = 8;

  let lastError: Error;
  while (tries < maxTries) {
    if (tries > 0) {
      logger.warn(`Downloading file, try ${tries}`);
    }

    try {
      await downloadToFile(onProgress, logger, url, file);
    } catch (originalErr) {
      let err = originalErr as HTTPError;
      if (err.httpStatusCode) {
        let shouldRetry = false;
        if (httpStatusesThatWarrantARetry.indexOf(err.httpStatusCode)) {
          shouldRetry = true;
        }

        if (shouldRetry) {
          lastError = originalErr;
          tries++;
          // exponential backoff: 1, 2, 4, 8 seconds...
          let numSeconds = tries * tries;
          // ...plus a random number of milliseconds.
          // see https://cloud.google.com/storage/docs/exponential-backoff
          let jitter = Math.random() % 1000;
          let sleepTime = numSeconds * 1000 + jitter;
          logger.warn(`While downloading file, got: ${err.stack}`);
          logger.warn(`Retrying after ${sleepTime.toFixed()}ms`);
          await delay(sleepTime);
          tries++;
          continue;
        }
      }
      throw originalErr;
    }
    return;
  }

  logger.warn(`${tries} failed, returning error.`);
  throw lastError;
}
