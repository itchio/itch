import { IRuntime } from "common/types";
import { itchPlatform } from "common/os/platform";

let cachedRuntime: IRuntime;

export function currentRuntime(): IRuntime {
  if (!cachedRuntime) {
    cachedRuntime = {
      platform: itchPlatform(),
    };
  }

  return cachedRuntime;
}
