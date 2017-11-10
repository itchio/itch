import { IPreferencesState } from "../../types";
import { Logger } from "../../logger/index";

import butler from "../../util/butler";
import * as paths from "../../os/paths";
import { MinimalContext } from "../../context/index";
import { Upload } from "ts-itchio-api";

interface IWipeDownloadFolderOpts {
  upload: Upload;
  logger: Logger;
  preferences: IPreferencesState;
}

export async function wipeDownloadFolder(opts: IWipeDownloadFolderOpts) {
  const { logger, upload, preferences } = opts;

  // for 'install' and 'reinstall' downloads, this path is where the
  // archives/installers are downloaded.
  // for 'upgrade', this is the staging folder for butler
  // for 'revert' / 'verify', this should normally be an empty folder
  const downloadFolderPath = paths.downloadFolderPath(upload, preferences);

  logger.debug(`Wiping download folder ${downloadFolderPath}`);
  try {
    await butler.wipe(downloadFolderPath, {
      ctx: new MinimalContext(),
      logger,
    });
  } catch (e) {
    logger.warn(
      `Could not wipe download folder ${downloadFolderPath}: ${e.stack}`
    );
  }
}
