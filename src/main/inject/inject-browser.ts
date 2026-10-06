import { contextBridge, ipcRenderer } from "electron";
import {
  BROWSER_OPEN_GAME_COLLECTIONS_CHANNEL,
  BROWSER_REFRESH_PAGE_CHANNEL,
} from "common/ipc";
import { isItchioOrigin } from "common/constants/urls";

// Preload for the in-app browser webview. Exposes a bridge to itch.io pages
// only; the main process re-checks the sender frame's origin on every call,
// so this check is not the security boundary. Anything passed in comes from
// the page and is validated again in main.ts.
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

    /**
     * Called by the site's "Add to collection" buttons. The site checks that
     * this exists and falls back to its own lightbox when it doesn't, so
     * don't rename it.
     */
    openGameCollections: (gameId: number) => {
      if (!Number.isSafeInteger(gameId) || gameId <= 0) {
        return;
      }
      ipcRenderer.send(BROWSER_OPEN_GAME_COLLECTIONS_CHANNEL, gameId);
    },
  });
}
