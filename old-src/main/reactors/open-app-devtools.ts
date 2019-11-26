import "electron";

export function openAppDevTools(bw: Electron.BrowserWindow) {
  if (bw) {
    const wc = bw.webContents;
    if (wc && !wc.isDestroyed()) {
      const dwc = wc.devToolsWebContents;
      if (dwc) {
        wc.devToolsWebContents.focus();
      } else {
        wc.openDevTools({ mode: "detach" });
      }
    }
  }
}
