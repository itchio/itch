
import {isEmpty} from "underscore";
import {fileSize} from "humanize-plus";
import {dirname} from "path";

import * as sf from "../os/sf";
import {Logger} from "../logger";
import {request} from "./request";

/**
 * Download to file without using butler
 */
export async function downloadToFile (logger: Logger, url: string, file: string) {
  const dir = dirname(file);
  try {
    await sf.mkdir(dir);
  } catch (e) {
    logger.error(`Could not create ${dir}: ${e.message}`);
  }

  const sink = sf.createWriteStream(file, {
    flags: "w",
    mode: 0o777,
    defaultEncoding: "binary",
  });

  let totalSize = 0;

  await request("get", url, {}, {
    sink,
    cb: (res) => {
      const contentLengthHeader = res.headers["content-length"];
      if (!isEmpty(contentLengthHeader)) {
        totalSize = parseInt(contentLengthHeader[0], 10);
      }
    },
  });
  await sf.promised(sink);

  const stats = await sf.lstat(file);
  logger.info(`downloaded ${fileSize(stats.size)} / ${fileSize(totalSize)} (${stats.size} bytes)`);

  if (totalSize !== 0 && stats.size !== totalSize) {
    throw new Error(`download failed (short size) for ${url}`);
  }
}
