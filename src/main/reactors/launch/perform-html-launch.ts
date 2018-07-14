import btoa from "btoa";
import querystring from "querystring";

import { BrowserWindow, shell } from "electron";

import { getInjectPath } from "common/util/resources";
import * as url from "common/util/url";

import { Context } from "main/context";

const noPreload = process.env.LEAVE_TWINY_ALONE === "1";

import {
  registerProtocol,
  setupItchInternal,
} from "main/reactors/launch/html/itch-internal";
import {
  Game,
  HTMLLaunchParams,
  HTMLLaunchResult,
} from "common/butlerd/messages";
import { Logger } from "common/logger";
import { ItchPromise } from "common/util/itch-promise";

interface HTMLLaunchOpts {
  ctx: Context;
  game: Game;
  logger: Logger;

  params: HTMLLaunchParams;
}

export async function performHTMLLaunch(
  opts: HTMLLaunchOpts
): Promise<HTMLLaunchResult> {
  const { ctx, logger, game, params } = opts;
  const { rootFolder, indexPath, env, args } = params;

  // TODO: think if this is the right place to do that?
  let { width, height } = { width: 1280, height: 720 };
  const { embed } = game;
  if (embed && embed.width && embed.height) {
    width = embed.width;
    height = embed.height;
  }

  logger.info(`performing HTML launch at resolution ${width}x${height}`);

  const partition = `persist:gamesession_${game.id}`;

  // TODO: show game icon as, well, the window's icon
  let win = new BrowserWindow({
    title: game ? game.title : null,
    width,
    height,
    center: true,
    show: true,

    /* used to be black, but that didn't work for everything */
    backgroundColor: "#fff",

    /* the width x height we give is content size, window will be slightly larger */
    useContentSize: true,

    webPreferences: {
      /* don't let web code control the OS */
      nodeIntegration: false,
      /* hook up a few keyboard shortcuts of our own */
      preload: noPreload ? null : getInjectPath("game"),
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
    win.webContents.openDevTools({ mode: "detach" });
  }
  win.setMenu(null);

  // strip 'Electron' from user agent so some web games stop being confused
  let userAgent = win.webContents.getUserAgent();
  userAgent = userAgent.replace(/Electron\/[0-9.]+\s/, "");
  win.webContents.setUserAgent(userAgent);

  await registerProtocol({ partition, fileRoot: rootFolder });

  setupItchInternal({
    session: win.webContents.session,
    onRequest: details => {
      let parsed = url.parse(details.url);
      switch (parsed.pathname.replace(/^\//, "")) {
        case "exit-fullscreen":
          win.setFullScreen(false);
          break;
        case "toggle-fullscreen":
          win.setFullScreen(!win.isFullScreen());
          break;
        case "open-devtools":
          win.webContents.openDevTools({ mode: "detach" });
          break;
        default:
          break;
      }
    },
  });

  win.webContents.on("new-window", (ev: Event, url: string) => {
    ev.preventDefault();
    shell.openExternal(url);
  });

  // nasty hack to pass in the itchObject
  const itchObjectBase64 = btoa(JSON.stringify(itchObject));
  const query = querystring.stringify({ itchObject: itchObjectBase64 });

  // don't use the HTTP cache, we already have everything on disk!
  const options = {
    extraHeaders: "pragma: no-cache\n",
  };

  win.loadURL(`itch-cave://game.itch/${indexPath}?${query}`, options);

  await new ItchPromise((resolve, reject) => {
    win.on("close", async () => {
      win.webContents.session.clearCache(resolve);
    });

    ctx.on("abort", () => {
      win.close();
    });
  });

  return {};
}
