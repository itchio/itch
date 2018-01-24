import { ICave, ICaveLocation } from "../../db/models/cave";
import { IPreferencesState, IDownloadItem } from "../../types/index";
import * as paths from "../../os/paths";

interface ICaveLocationResult {
  caveLocation: ICaveLocation;
  absoluteInstallFolder: string;
}

export function computeCaveLocation(
  item: IDownloadItem,
  preferences: IPreferencesState,
  caveIn: ICave | null
): ICaveLocationResult {
  const { caveId, installLocation, installFolder } = item;

  let caveLocation: ICaveLocation = caveIn
    ? caveIn
    : {
        id: caveId,
        installFolder,
        installLocation,
        pathScheme: paths.PathScheme.MODERN_SHARED,
      };
  const absoluteInstallFolder = paths.appPath(caveLocation, preferences);

  return { caveLocation, absoluteInstallFolder };
}
