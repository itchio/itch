import { itchPlatform } from "./index";
import { IRuntime } from "common/types";

export function runtimeProp(runtime: IRuntime): string {
  switch (runtime.platform) {
    case "osx":
      return "pOsx";
    case "windows":
      return "pWindows";
    case "linux":
      return "pLinux";
    default:
      return "";
  }
}

let cachedRuntime: IRuntime;

export function currentRuntime(): IRuntime {
  if (!cachedRuntime) {
    cachedRuntime = {
      platform: itchPlatform(),
    };
  }

  return cachedRuntime;
}
