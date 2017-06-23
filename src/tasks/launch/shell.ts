import { join } from "path";
import { appPath } from "../../os/paths";

import { shell } from "electron";

import { EventEmitter } from "events";
import { ILaunchOpts } from "../../types";

import store from "../../store/metal-store";

export default async function launch(out: EventEmitter, opts: ILaunchOpts) {
  const { cave, manifestAction } = opts;

  let relativePath = ".";
  if (manifestAction) {
    relativePath = manifestAction.path;
  }

  const { preferences } = store.getState();
  const fullPath = join(appPath(cave, preferences), relativePath);
  shell.openItem(fullPath);
}
