import * as os from "../../os";

export type ItchRuntimeProp = "pOsx" | "pWindows" | "pLinux" | "";

export interface IRuntime {
  platform: os.ItchPlatform;
  is64: boolean;
}

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

export function runtimeString(runtime: IRuntime): string {
  return `${runtime.is64 ? "64" : "32"}-bit ${runtime.platform}`;
}

let cachedRuntime: IRuntime;

export function currentRuntime(): IRuntime {
  if (!cachedRuntime) {
    cachedRuntime = {
      platform: os.itchPlatform(),
      is64: is64(),
    };
  }

  return cachedRuntime;
}

function is64(): boolean {
  switch (process.platform) {
    case "linux":
      return os.isLinux64();
    case "win32": // yeah win32 can be 64, don't @ me
      return os.isWin64();
    default:
      // we don't ship 32-bit for macOS, so that's an easy one.
      return true;
  }
}
