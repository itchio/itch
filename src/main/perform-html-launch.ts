import btoa from "btoa";
import {
  Game,
  HTMLLaunchParams,
  HTMLLaunchResult,
} from "common/butlerd/messages";
import { Logger } from "common/logger";
import { BrowserWindow, session, shell } from "electron";
import querystring from "querystring";
import { registerItchCaveProtocol } from "main/itch-cave-protocol";
import { envSettings } from "main/constants/env-settings";

interface HTMLLaunchOpts {
  game: Game;
  logger: Logger;

  params: HTMLLaunchParams;
  onAbort(handler: () => void): void;
}

export async function performHTMLLaunch(
  opts: HTMLLaunchOpts
): Promise<HTMLLaunchResult> {
  const { logger, game, params } = opts;
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

  registerItchCaveProtocol(gameSession, rootFolder);

  // TODO: show game icon as, well, the window's icon
  let win = new BrowserWindow({
    title: game?.title,
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
      /* stores cookies etc. in persistent session to save progress */
      session: gameSession,
      /* disable CORS to allow access to the itch.io API */
      webSecurity: false,
    },
  });

  const itchObject = {
    env,
    args,
  };

  // open dev tools immediately if requested
  if (envSettings.gameDevtools) {
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

  logger.info(`Waiting for window to close or context to be aborted...`);
  await new Promise((resolve, reject) => {
    win.on("closed", () => {
      resolve();
    });

    opts.onAbort(() => {
      win.close();
      resolve();
    });
  });
  logger.info(`HTML launch promise has resolved`);

  return {};
}
