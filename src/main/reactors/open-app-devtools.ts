import "electron";

export function openAppDevTools(bw: Electron.BrowserWindow) {
  if (bw && bw.webContents) {
    bw.webContents.openDevTools({ mode: "detach" });
  }
}
