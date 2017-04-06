
import * as ospath from "path";

import {shell} from "electron";

import pathmaker from "../../util/pathmaker";

import {EventEmitter} from "events";
import {IStartTaskOpts} from "../../types";

import store from "../../store/metal-store";

interface ILaunchOpts extends IStartTaskOpts {}

export default async function launch(out: EventEmitter, opts: ILaunchOpts) {
  const {cave, manifestAction} = opts;

  const appPath = pathmaker.appPath(cave, store.getState().preferences);
  const fullPath = ospath.join(appPath, manifestAction.path);
  shell.openItem(fullPath);
}
