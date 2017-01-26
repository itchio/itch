
import {EventEmitter} from "events";

import * as btoa from "btoa";
import * as ospath from "path";
import * as invariant from "invariant";
import * as querystring from "querystring";

import {app, BrowserWindow, shell, powerSaveBlocker} from "../../electron";

import url from "../../util/url";
import fetch from "../../util/fetch";
import pathmaker from "../../util/pathmaker";
import debugBrowserWindow from "../../util/debug-browser-window";

const noPreload = process.env.LEAVE_TWINY_ALONE === "1";

const WEBGAME_PROTOCOL = "itch-cave";

import mklog from "../../util/log";
const log = mklog("tasks/launch");

import {IStartTaskOpts} from "../../types";

interface IBeforeSendHeadersDetails {
  url: string;
}

interface IBeforeSendHeadersCallbackOpts {
  cancel: boolean;
}

interface IBeforeSendHeadersCallback {
  (opts: IBeforeSendHeadersCallbackOpts): void;
}

interface IRegisteredProtocols {
  [key: string]: boolean;
}

const registeredProtocols: IRegisteredProtocols = {};

interface IRegisterProtocolOpts {
  partition: string;
  fileRoot: string;
}

async function registerProtocol (opts: IRegisterProtocolOpts) {
  const {partition, fileRoot} = opts;
  
  if (registeredProtocols[partition]) {
    return;
  }

  const {session} = require("electron");
  const caveSession = session.fromPartition(partition);

  await new Promise((resolve, reject) => {
    caveSession.protocol.registerFileProtocol(WEBGAME_PROTOCOL, (request, callback) => {
      const urlPath = url.parse(request.url).pathname;
      const filePath = ospath.join(fileRoot, urlPath.replace(/^\//, ""));

      callback({
        path: filePath,
      });
    }, (error) => {
      if (error) {
        reject(error);
      } else {
        resolve();
      }
    });
  });

  const handled = await new Promise((resolve, reject) => {
    caveSession.protocol.isProtocolHandled(WEBGAME_PROTOCOL, (result) => {
      resolve(result);
    });
  });

  if (!handled) {
    throw new Error(`could not register custom protocol ${WEBGAME_PROTOCOL}`);
  }

  registeredProtocols[partition] = true;
}

export default async function launch (out: EventEmitter, opts: IStartTaskOpts) {
  const {cave, market, credentials, args, env} = opts;
  invariant(cave, "launch-html has cave");
  invariant(market, "launch-html has market");
  invariant(credentials, "launch-html has credentials");
  invariant(env, "launch-html has env");
  invariant(args, "launch-html has args");

  const game = await fetch.gameLazily(market, credentials, cave.gameId, {game: cave.game});
  const injectPath = ospath.resolve(__dirname, "..", "..", "inject", "game.js");

  const appPath = pathmaker.appPath(cave);
  const entryPoint = ospath.join(appPath, cave.gamePath);

  log(opts, `entry point: ${entryPoint}`);

  const {width, height} = cave.windowSize;
  log(opts, `starting at resolution ${width}x${height}`);

  const partition = `persist:gamesession_${cave.gameId}`;

  let win = new BrowserWindow({
    title: game.title,
    icon: `./static/images/tray/${app.getName()}.png`,
    width, height,
    center: true,
    show: true,

    /* used to be black, but that didn't work for everything */
    backgroundColor: "#fff",

    /* the width x height we give is content size, window will be slightly larger */
    useContentSize: true,

    webPreferences: {
      /* don't let web code control the OS */
      nodeIntegration: false,
      /* don't enforce same-origin policy (to allow API requests) */
      webSecurity: false,
      allowRunningInsecureContent: true,
      /* hook up a few keyboard shortcuts of our own */
      preload: noPreload ? null : injectPath,
      /* stores cookies etc. in persistent session to save progress */
      partition,
    },
  });

  const itchObject = {
    env,
    args,
  };

  // open dev tools immediately if requested
  if (process.env.IMMEDIATE_NOSE_DIVE === "1") {
    debugBrowserWindow(`game ${game.title}`, win);
    win.webContents.openDevTools({mode: "detach"});
  }

  // hide menu, cf. https://github.com/itchio/itch/issues/232
  win.setMenuBarVisibility(false);
  win.setMenu(null);

  // strip 'Electron' from user agent so some web games stop being confused
  let userAgent = win.webContents.getUserAgent();
  userAgent = userAgent.replace(/Electron\/[0-9.]+\s/, "");
  win.webContents.setUserAgent(userAgent);

  // requests to 'itch-internal' are used to communicate between web content & the app
  let internalFilter = {
    urls: ["https://itch-internal/*"],
  };
  win.webContents.session.webRequest.onBeforeRequest({urls: ["itch-cave://*"]}, (details, callback) => {
    let parsed = url.parse(details.url);
    // resources in `//` will be loaded using itch-cave, we need to
    // redirect them to https for it to work - note this only happens with games
    // that aren't fully offline-mode compliant
    if (parsed.protocol === "itch-cave:" && parsed.host !== "game.itch") {
      callback({
        redirectURL: details.url.replace(/^itch-cave:/, "https:"),
      });
    } else {
      callback({});
    }
  });

  win.webContents.session.webRequest.onBeforeSendHeaders(
      internalFilter, (details: IBeforeSendHeadersDetails, callback: IBeforeSendHeadersCallback) => {
    callback({cancel: true});

    let parsed = url.parse(details.url);
    switch (parsed.pathname.replace(/^\//, "")) {
      case "exit-fullscreen":
        win.setFullScreen(false);
        break;
      case "toggle-fullscreen":
        win.setFullScreen(!win.isFullScreen());
        break;
      case "open-devtools":
        win.webContents.openDevTools({mode: "detach"});
        break;
      default:
        break;
    }
  });

  win.webContents.on("new-window", (ev: Event, url: string) => {
    ev.preventDefault();
    shell.openExternal(url);
  });

  // serve files
  let fileRoot = ospath.dirname(entryPoint);
  let indexName = ospath.basename(entryPoint);

  await registerProtocol({partition, fileRoot});

  // nasty hack to pass in the itchObject
  const itchObjectBase64 = btoa(JSON.stringify(itchObject));
  const query = querystring.stringify({itchObject: itchObjectBase64});

  // don't use the HTTP cache, we already have everything on disk!
  const options = {
    extraHeaders: "pragma: no-cache\n",
  };

  win.loadURL(`itch-cave://game.itch/${indexName}?${query}`, options);

  const blockerId = powerSaveBlocker.start("prevent-display-sleep");

  await new Promise((resolve, reject) => {
    win.on("close", () => {
      win.webContents.session.clearCache(resolve);
    });

    out.once("cancel", () => {
      win.close();
    });
  });

  powerSaveBlocker.stop(blockerId);
}
