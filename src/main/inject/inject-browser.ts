import { contextBridge, ipcRenderer } from "electron";
import { BROWSER_REFRESH_PAGE_CHANNEL } from "common/ipc";
import { isItchioOrigin } from "common/constants/urls";

// Preload for the in-app browser webview. Exposes a data-less bridge to
// itch.io pages only; the main process re-checks the sender frame's origin
// on every call, so this check is not the security boundary.
if (process.isMainFrame && isItchioOrigin(window.location.href)) {
  contextBridge.exposeInMainWorld("ItchApp", {
    /**
     * Asks the app to re-read this page's meta[name="itch:path"] tag and
     * update the tab's resource (e.g. the game context bar). For pages
     * that swap content without navigating.
     */
    refreshPage: () => {
      ipcRenderer.send(BROWSER_REFRESH_PAGE_CHANNEL);
    },
  });
}
