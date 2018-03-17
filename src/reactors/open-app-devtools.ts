import "electron";

export async function openAppDevTools(bw: Electron.BrowserWindow) {
  if (bw && bw.webContents) {
    bw.webContents.openDevTools({ mode: "detach" });
    const hasReactDevTools = await bw.webContents.executeJavaScript(`
        require("electron-react-devtools").install()
    `);
    if (hasReactDevTools) {
      console.log(`Installed react devtools!`);
      bw.webContents.reload();
    }
  }
}
