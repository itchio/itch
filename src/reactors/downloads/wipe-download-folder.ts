import { IPreferencesState, IDownloadItem } from "../../types";
import { Logger } from "../../logger/index";

import butler from "../../util/butler";
import * as paths from "../../os/paths";
import { MinimalContext } from "../../context/index";

interface IWipeDownloadFolderOpts {
  item: IDownloadItem;
  logger: Logger;
  preferences: IPreferencesState;
}

export async function wipeDownloadFolder(opts: IWipeDownloadFolderOpts) {
  const { logger, item, preferences } = opts;

  const downloadFolderPath = paths.downloadFolderPathForId(
    item.id,
    preferences
  );

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
