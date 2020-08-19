import yauzl from "yauzl";
import progress from "progress-stream";
const crc32 = require("crc-32");
const yauzlOpen = promisify(yauzl.open) as (
  path: string,
  options: yauzl.Options
) => Promise<yauzl.ZipFile>;

import * as sf from "main/os/sf";
import { dirname, join } from "path";
import { createWriteStream } from "fs";
import { Logger } from "common/logger";
import { ProgressInfo } from "common/types";
import { promisify } from "util";

interface UnzipOpts {
  archivePath: string;
  destination: string;
  logger: Logger;
  onProgress: (info: ProgressInfo) => void;
}

const DIR_RE = /\/$/;

export async function unzip(opts: UnzipOpts) {
  const { archivePath, destination, logger } = opts;
  await sf.mkdir(destination);

  const zipfile = await yauzlOpen(archivePath, { lazyEntries: true });
  logger.debug(`Total zip entries: ${zipfile.entryCount}`);
  logger.debug(`.zip filesize: ${zipfile.fileSize}`);
  zipfile.readEntry();

  let progressOffset = 0;

  const extractEntry = async (
    entry: yauzl.Entry,
    err: Error,
    src: NodeJS.ReadableStream
  ) => {
    if (err) {
      throw err;
    }

    const entryPath = join(destination, entry.fileName);
    logger.info(`Extracting ${entryPath}`);

    await sf.mkdir(dirname(entryPath));
    const dst = createWriteStream(entryPath);
    const progressStream = progress({
      length: entry.uncompressedSize,
      time: 100,
    });
    let progressFactor = entry.compressedSize / zipfile.fileSize;
    progressStream.on("progress", (info) => {
      opts.onProgress({
        progress: progressOffset + (info.percentage / 100) * progressFactor,
      });
    });
    /****************************************************************************
     * 💩 Crash course in Node Streams 💩
     *
     * Survival tips:
     *
     * 1. pipe() returns the destination stream.
     *    This is so you can chain pipe() calls, lulling you into a false sense of security.
     *
     * 2. If you don't subscribe to the "error" event, ***that's an uncaught exception***,
     *    which takes down the whole app.
     *
     *    It is thrown from what I can only assume is a scheduler, because the error does
     *    not have any stack trace anyway. It doesn't throw in the current function, or reject
     *    the current promise.
     *
     * 3. Whenever a destination stream encounters an error, it will unpipe itself
     *    from its source.
     *
     * 4. Errors do not propagate.
     *
     *    So, if you have A->B->C and C craps out, A->B will still be live and happily
     *    hanging forever once it's filled whatever buffer space it has.
     *
     * 5. Nobody agrees on what the final event is - might be "finish", "close", "end", or "error",
     *    gotta read the docs (and hope the docs are right!)
     *
     * 6. Stream "end"/"finish"/etc. *does* propagate, because in src.pipe(dst, opts?),
     *    opts = {end: true} is the default.
     *
     * 7. If you have A->B->C and A finishes, it doesn't mean C is done. In our case,
     *    A decompresses a zlib stream, B measures progress, and C writes to a file, so
     *    we have to wait for C to be done.
     *
     ***************************************************************************/
    src.pipe(progressStream).pipe(dst);
    await new Promise((_resolve, _reject) => {
      let timeout = setTimeout(() => {
        logger.warn(
          `Extracting a single entry took more than 10 seconds, something's wrong`
        );
      }, 10 * 1000 /* 10 seconds */);
      let resolve = () => {
        clearTimeout(timeout);
        _resolve();
      };
      let reject = (err: Error) => {
        clearTimeout(timeout);
        _reject(err);
      };

      src.on("error", (err) => {
        logger.warn(`Caught yauzl error: ${err.stack}`);
        reject(err);
      });
      progressStream.on("error", (err) => {
        logger.warn(`Caught progress stream error: ${err.stack}`);
        reject(err);
      });
      dst.on("error", (err) => {
        logger.warn(`Caught output stream error: ${err.stack}`);
        reject(err);
      });
      dst.on("finish", () => {
        resolve();
      });
    });

    progressOffset += progressFactor;
    await sf.chmod(entryPath, 0o755);

    const fileBuffer = await sf.readFile(entryPath, { encoding: null });
    const signedHash = crc32.buf(fileBuffer);
    // this converts an int32 to an uint32 (which is what yauzl reports)
    const hash = new Uint32Array([signedHash])[0];
    if (hash !== entry.crc32) {
      await sf.unlink(entryPath);
      throw new Error(
        `CRC32 mismatch for ${entry.fileName}: expected ${entry.crc32} got ${hash}`
      );
    }
  };

  await new Promise((resolve, reject) => {
    zipfile.on("entry", (entry: yauzl.Entry) => {
      logger.debug(`→ ${entry.fileName}`);
      if (DIR_RE.test(entry.fileName)) {
        // don't do anything for directories
        zipfile.readEntry();
      } else {
        // file entry
        zipfile.openReadStream(entry, function (err, src) {
          extractEntry(entry, err, src)
            .then(() => {
              zipfile.readEntry();
            })
            .catch((err) => {
              reject(err);
              zipfile.close();
            });
        });
      }
    });
    zipfile.on("end", (entry) => {
      resolve();
    });
  });
}
