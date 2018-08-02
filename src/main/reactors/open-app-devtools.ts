import "electron";

export function openAppDevTools(bw: Electron.BrowserWindow) {
  if (bw && bw.webContents) {
    bw.webContents.openDevTools({ mode: "detach" });
    if (process.env.NODE_ENV !== "production") {
      console.log(
        "%cIf you want to use React DevTools, use the standalone: https://github.com/facebook/react-devtools",
        "color: #0366d6"
      );
    }
  }
}
