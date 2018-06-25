import { itchPlatform } from "./index";
import { IRuntime } from "common/types";

let cachedRuntime: IRuntime;

export function currentRuntime(): IRuntime {
  if (!cachedRuntime) {
    cachedRuntime = {
      platform: itchPlatform(),
    };
  }

  return cachedRuntime;
}
