import store from "../../store/metal-store";
import { downloadBasePath } from "../../os/paths";
import butler from "../../util/butler";
import { MinimalContext } from "../../context/index";
import { devNull } from "../../logger";

export async function cleanDownloadFolders() {
  const { preferences } = store.getState();
  const ctx = new MinimalContext();

  let installLocations = [
    "appdata",
    ...Object.keys(preferences.installLocations),
  ];
  for (const loc of installLocations) {
    const path = downloadBasePath(loc, preferences);
    await butler.wipe(path, {
      ctx,
      logger: devNull,
    });
  }
}
