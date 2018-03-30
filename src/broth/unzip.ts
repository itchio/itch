import * as yauzl from "yauzl";
import * as progress from "progress-stream";
import { ItchPromise, promisify } from "../util/itch-promise";
const crc32 = require("crc-32");
const yauzlOpen = promisify(yauzl.open) as (
  path: string,
  options: yauzl.Options
) => Promise<yauzl.ZipFile>;

import * as sf from "../os/sf";
import { dirname, join } from "path";
import { createWriteStream } from "fs";
import { Logger } from "../logger";
import { Stream } from "stream";
import { IProgressInfo } from "../types";

interface UnzipOpts {
  archivePath: string;
  destination: string;
  logger: Logger;
  onProgress: (info: IProgressInfo) => void;
}

const DIR_RE = /\/$/;

export async function unzip(opts: UnzipOpts) {
  const { archivePath, destination, logger } = opts;
  await sf.mkdirp(destination);

  const zipfile = await yauzlOpen(archivePath, { lazyEntries: true });
  logger.debug(`Total zip entries: ${zipfile.entryCount}`);
  logger.debug(`.zip filesize: ${zipfile.fileSize}`);
  zipfile.readEntry();

  let progressOffset = 0;

  const extractEntry = async (entry: yauzl.Entry, err: Error, src: Stream) => {
    if (err) {
      throw err;
    }

    const entryPath = join(destination, entry.fileName);

    await sf.mkdirp(dirname(entryPath));
    const dst = createWriteStream(entryPath);
    const progressStream = progress({
      length: entry.uncompressedSize,
      time: 100,
    });
    let progressFactor = entry.compressedSize / zipfile.fileSize;
    progressStream.on("progress", info => {
      opts.onProgress({
        progress: progressOffset + info.percentage / 100 * progressFactor,
      });
    });
    progressStream.pipe(dst);
    src.pipe(progressStream);
    await sf.promised(dst);
    progressOffset += progressFactor;
    await sf.chmod(entryPath, 0o755);

    const fileBuffer = await sf.readFile(entryPath, { encoding: null });
    const signedHash = crc32.buf(fileBuffer);
    // this converts an int32 to an uint32 (which is what yauzl reports)
    const hash = new Uint32Array([signedHash])[0];
    if (hash !== entry.crc32) {
      await sf.unlink(entryPath);
      throw new Error(
        `CRC32 mismatch for ${entry.fileName}: expected ${
          entry.crc32
        } got ${hash}`
      );
    }
  };

  await new ItchPromise((resolve, reject) => {
    zipfile.on("entry", (entry: yauzl.Entry) => {
      logger.debug(`→ ${entry.fileName}`);
      if (DIR_RE.test(entry.fileName)) {
        // don't do anything for directories
        zipfile.readEntry();
      } else {
        // file entry
        zipfile.openReadStream(entry, function(err, src) {
          extractEntry(entry, err, src)
            .catch(reject)
            .then(() => {
              zipfile.readEntry();
            });
        });
      }
    });
    zipfile.on("end", entry => {
      resolve();
    });
  });
}
