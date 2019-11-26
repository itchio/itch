import { LocalizedString } from "common/types";

export function showInExplorerString(): LocalizedString {
  switch (process.platform) {
    case "linux": {
      return ["grid.item.open_file_location.linux"];
    }
    case "darwin": {
      return ["grid.item.open_file_location.osx"];
    }
    case "win32":
    default: {
      return ["grid.item.open_file_location.windows"];
    }
  }
}
