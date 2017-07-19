import { shell } from "electron";

import { ILaunchOpts } from "../../types";
import Context from "../../context";

export default async function launch(ctx: Context, opts: ILaunchOpts) {
  const { manifestAction } = opts;

  shell.openItem(manifestAction.path);
}
