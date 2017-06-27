import { join } from "path";
import { appPath } from "../../os/paths";

import { shell } from "electron";

import { ILaunchOpts } from "../../types";
import Context from "../../context";

import store from "../../store/metal-store";

export default async function launch(ctx: Context, opts: ILaunchOpts) {
  const { cave, manifestAction } = opts;

  let relativePath = ".";
  if (manifestAction) {
    relativePath = manifestAction.path;
  }

  const { preferences } = store.getState();
  const fullPath = join(appPath(cave, preferences), relativePath);
  shell.openItem(fullPath);
}
