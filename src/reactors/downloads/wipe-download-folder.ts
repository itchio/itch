import { IPreferencesState, IDownloadItem } from "../../types";
import { Logger } from "../../logger/index";

import butler from "../../util/butler";
import * as paths from "../../os/paths";
import { MinimalContext } from "../../context/index";
import { ICave } from "../../db/models/cave";
import { computeCaveLocation } from "./compute-cave-location";

interface IWipeFolderOpts {
  caveIn?: ICave;
  item: IDownloadItem;
  logger: Logger;
  preferences: IPreferencesState;
}

export async function wipeDownloadFolder(opts: IWipeFolderOpts) {
  const { item, preferences, caveIn } = opts;

  const { caveLocation } = computeCaveLocation(item, preferences, caveIn);

  const downloadFolderPath = paths.downloadFolderPathForId(
    preferences,
    caveLocation.installLocation,
    item.id
  );

  return await wipeFolder(opts, "download", downloadFolderPath);
}

export async function wipeInstallFolder(opts: IWipeFolderOpts) {
  const { item, preferences, caveIn } = opts;

  const { absoluteInstallFolder } = computeCaveLocation(
    item,
    preferences,
    caveIn
  );
  return await wipeFolder(opts, "install", absoluteInstallFolder);
}

async function wipeFolder(
  opts: IWipeFolderOpts,
  kind: string,
  absoluteFolderPath
) {
  const { logger } = opts;

  logger.debug(`Wiping download folder ${absoluteFolderPath}`);
  try {
    await butler.wipe(absoluteFolderPath, {
      ctx: new MinimalContext(),
      logger,
    });
  } catch (e) {
    logger.warn(
      `Could not wipe download folder ${absoluteFolderPath}: ${e.stack}`
    );
  }
}
