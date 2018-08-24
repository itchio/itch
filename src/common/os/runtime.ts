import { Runtime } from "common/types";
import { itchPlatform } from "common/os/platform";

let cachedRuntime: Runtime;

export function currentRuntime(): Runtime {
  if (!cachedRuntime) {
    cachedRuntime = {
      platform: itchPlatform(),
    };
  }

  return cachedRuntime;
}
