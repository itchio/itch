import { shell } from "electron";

export function open(folder: string) {
  if (process.platform === "darwin") {
    // openItem will open the finder but it will appear *under* the app
    // which is a bit silly, so we just reveal it instead.
    shell.showItemInFolder(folder);
  } else {
    shell.openPath(folder);
  }
}
