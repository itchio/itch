import * as ospath from "path";
import * as electron from "electron";

let _binPath: string = null;

export function getBinPath() {
  if (!_binPath) {
    const app = electron.app || electron.remote.app;
    _binPath = ospath.join(app.getPath("userData"), "bin");
  }

  return _binPath;
}
