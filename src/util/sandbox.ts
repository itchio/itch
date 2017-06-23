import { platform } from "../os";

import { ISandbox } from "./sandbox/types";
import win32Sandbox from "./sandbox/win32";
import linuxSandbox from "./sandbox/linux";
import darwinSandbox from "./sandbox/darwin";

let sandbox: ISandbox;
switch (platform()) {
  case "win32":
    sandbox = win32Sandbox;
    break;
  case "linux":
    sandbox = linuxSandbox;
    break;
  case "darwin":
    sandbox = darwinSandbox;
    break;
  default:
  // muffin;
}

export default sandbox;
