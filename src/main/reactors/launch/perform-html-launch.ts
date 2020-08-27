import btoa from "btoa";
import querystring from "querystring";

import { BrowserWindow, shell, session } from "electron";

import { getInjectPath } from "common/util/resources";
import * as url from "common/util/url";

import { Context } from "main/context";

const noPreload = process.env.LEAVE_TWINY_ALONE === "1";

import {
  Game,
  HTMLLaunchParams,
  HTMLLaunchResult,
} from "common/butlerd/messages";
import { Logger } from "common/logger";
import { registerItchCaveProtocol } from "main/reactors/launch/itch-cave-protocol";

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

  logger.info(`Performing HTML launch at resolution ${width}x${height}`);

  const partition = `persist:gamesession_${game.id}`;
  const gameSession = session.fromPartition(partition, { cache: false });

  await registerItchCaveProtocol(gameSession, rootFolder);

  // TODO: show game icon as, well, the window's icon
  let win = new BrowserWindow({
    title: game ? game.title : null,
    width,
    height,
    center: true,
    show: true,

    // used to be black, but a lot of web pages don't
    // specify their own background color and default
    // to black text, so.
    backgroundColor: "#fff",

    // the width x height we give is content size, window will be slightly larger
    useContentSize: true,

    webPreferences: {
      // don't let web code control the OS
      nodeIntegration: false,
      // disable remote module
      enableRemoteModule: false,
      // hooks up keyboard shortcuts, etc.
      preload: noPreload ? null : getInjectPath("game"),
      // stores cookies etc. in persistent session to save progress
      session: gameSession,
      // disable CORS to allow access to the itch.io API from an
      // itch:// origin.
      webSecurity: false,
      // run preload scripts in isolated context
      contextIsolation: true,
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
  win.removeMenu();

  // strip 'Electron' from user agent so some web games stop being confused
  let userAgent = win.webContents.getUserAgent();
  userAgent = userAgent.replace(/Electron\/[0-9.]+\s/, "");
  win.webContents.setUserAgent(userAgent);

  const toggleFullscreen = () => {
    win.setFullScreen(!win.isFullScreen());
  };

  win.webContents.on(
    "before-input-event",
    (ev: Electron.Event, input: Electron.Input) => {
      if (input.type === "keyUp") {
        switch (input.key) {
          case "F11":
            toggleFullscreen();
            break;
          case "F":
            if (input.meta) {
              toggleFullscreen();
            }
            break;
          case "Escape":
            if (win.isFullScreen()) {
              win.setFullScreen(false);
            }
            break;
          case "F12":
            if (input.shift) {
              win.webContents.openDevTools({ mode: "detach" });
            }
            break;
        }
      }
    }
  );

  win.webContents.on("new-window", (ev: Event, url: string) => {
    ev.preventDefault();
    let u = new URL(url);
    if (u.protocol == "http" || u.protocol == "https") {
      shell.openExternal(url);
    } else {
      logger.warn(`Prevented opening external URL: ${url}`);
    }
  });

  // nasty hack to pass in the itchObject
  const itchObjectBase64 = btoa(JSON.stringify(itchObject));
  const query = querystring.stringify({ itchObject: itchObjectBase64 });

  // don't use the HTTP cache, we already have everything on disk!
  const options = {
    extraHeaders: "pragma: no-cache\n",
  };

  win.loadURL(`itch-cave://game.itch/${indexPath}?${query}`, options);

  logger.info(`Waiting for window to close or context to be aborted...`);
  await new Promise((resolve, reject) => {
    win.on("closed", () => {
      resolve();
    });

    ctx.on("abort", () => {
      win.close();
      resolve();
    });
  });
  logger.info(`HTML launch promise has resolved`);

  return {};
}
