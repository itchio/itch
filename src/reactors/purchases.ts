import { Watcher } from "./watcher";

import url from "../util/url";
import enableEventDebugging from "../util/debug-browser-window";
import { getInjectPath } from "../os/resources";

import rootLogger from "../logger";
const logger = rootLogger.child({ name: "purchases" });

import { actions } from "../actions";

import { BrowserWindow } from "electron";
import { User, Game } from "../buse/messages";

/**
 * Creates a new browser window to initiate the purchase flow
 */
function makePurchaseWindow(me: User, game: Game) {
  const partition = `persist:itchio-${me.id}`;

  const win = new BrowserWindow({
    width: 960,
    height: 620,
    center: true,
    title: game.title,
    webPreferences: {
      /* don't let web code control the OS */
      nodeIntegration: false,
      /* prevent window close, prefill login form, etc. */
      preload: getInjectPath("itchio"),
      /* stores browser session in an user_id-specific partition so,
       * in multi-seat installs, users have to log in one time each at least */
      partition,
    },
  });

  // Prevents the window contents from being captured by other apps.
  // On macOS it sets the NSWindow's sharingType to NSWindowSharingNone.
  // On Windows it calls SetWindowDisplayAffinity with WDA_MONITOR.
  win.setContentProtection(true);

  // hide menu, cf. https://github.com/itchio/itch/issues/232
  win.setMenuBarVisibility(false);

  return win;
}

interface IUrlOpts {
  hostname: string;
  pathname: string;
  query: any;
  protocol?: string;
  port?: number;
}

function buildLoginAndReturnUrl(returnTo: string): string {
  const parsed = url.parse(returnTo);
  const hostname = url.subdomainToDomain(parsed.hostname);

  let urlOpts = {
    hostname,
    pathname: "/login",
    query: { return_to: returnTo },
  } as IUrlOpts;

  if (hostname === "itch.io") {
    urlOpts.protocol = "https";
  } else {
    urlOpts.port = parsed.port;
    urlOpts.protocol = parsed.protocol;
  }

  return url.format(urlOpts);
}

export default function(watcher: Watcher) {
  watcher.on(actions.initiatePurchase, async (store, action) => {
    const { game } = action.payload;

    const me = store.getState().session.credentials.me;
    const win = makePurchaseWindow(me, game);

    if (process.env.CAST_NO_SHADOW === "1") {
      enableEventDebugging("purchase", win);
      win.webContents.openDevTools({ mode: "detach" });
    }

    const purchaseUrl = game.url + "/purchase";
    const loginPurchaseUrl = buildLoginAndReturnUrl(purchaseUrl);
    logger.debug(`partition login purchase url = ${loginPurchaseUrl}`);

    // FIXME: that's probably not the best event
    win.webContents.on("did-get-redirect-request", (e, oldURL, newURL) => {
      const parsed = url.parse(newURL);

      if (/^.*\/download\/[a-zA-Z0-9]*$/.test(parsed.pathname)) {
        // purchase went through!
        store.dispatch(actions.purchaseCompleted({ game }));
        win.close();
      } else if (/\/pay\/cancel/.test(parsed.pathname)) {
        // payment was cancelled
        win.close();
      }
    });

    win.webContents.on("did-get-response-details", async function(
      e,
      status,
      newURL,
      originalURL,
      httpResponseCode
    ) {
      if (httpResponseCode === 404 && newURL === purchaseUrl) {
        logger.debug(`404 not found: ${newURL}`);
        logger.debug("closing because of 404");
        win.close();
      }
    });

    win.loadURL(loginPurchaseUrl);
    win.show();
  });
}
