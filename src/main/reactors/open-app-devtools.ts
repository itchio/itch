import "electron";

export async function openAppDevTools(bw: Electron.BrowserWindow) {
  if (bw && bw.webContents) {
    bw.webContents.openDevTools({ mode: "detach" });
    const hasReactDevTools = await bw.webContents.executeJavaScript(`
        require("electron-react-devtools").install()
    `);
    if (hasReactDevTools) {
      console.log(`Installed react devtools!`);
      await bw.webContents.executeJavaScript(
        `console.log("React DevTools installed, reload the page (Shift+F5) for the React tab to show up.")`
      );
    }
  }
}
