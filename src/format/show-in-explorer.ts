import { currentRuntime } from "../os/runtime";
import { ILocalizedString } from "../types/index";

const runtime = currentRuntime();

export function showInExplorerString(): ILocalizedString {
  switch (runtime.platform) {
    case "linux": {
      return ["grid.item.open_file_location.linux"];
    }
    case "osx": {
      return ["grid.item.open_file_location.osx"];
    }
    case "windows":
    default: {
      return ["grid.item.open_file_location.windows"];
    }
  }
}
