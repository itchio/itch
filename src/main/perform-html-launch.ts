import {
  Game,
  HTMLLaunchParams,
  HTMLLaunchResult,
} from "@itchio/valet/messages";
import { Logger } from "common/logger";
import { app, BrowserWindow, session, shell } from "electron";
import { envSettings } from "main/constants/env-settings";
import { writeFile } from "main/fs";
import { registerItchCaveProtocol } from "main/itch-cave-protocol";
import { join } from "path";

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

  const injectPath = join(app.getPath("temp"), `game_${game.id}_inject.js`);
  const itchObject = { env, args };
  await writeFile(injectPath, generateInject(itchObject), "utf8");
  logger.info(`Wrote inject file to (${injectPath})`);

  // TODO: show game icon as, well, the window's icon
  let win = new BrowserWindow({
    title: game?.title,
    width,
    height,
    center: true,
    show: true,

    // used to be black, but that didn't work for everything
    backgroundColor: "#fff",

    // the width x height we give is content size, window will be slightly larger
    useContentSize: true,

    webPreferences: {
      // don't let web code control the OS
      nodeIntegration: false,
      // stores cookies etc. in persistent session to save progress
      session: gameSession,
      // disable CORS to allow access to the itch.io API
      webSecurity: false,
      // execute some javascript *before* the game, to set up the environment
      // object, etc.
      preload: injectPath,
    },
  });

  // open dev tools immediately if requested
  let wc = win.webContents;
  if (envSettings.gameDevtools) {
    wc.openDevTools({ mode: "detach" });
  }
  win.removeMenu();

  // strip 'Electron' from user agent so some web games stop being confused
  wc.userAgent = wc.userAgent.replace(/Electron\/[0-9.]+\s/, "");

  const toggleFullscreen = () => {
    win.setFullScreen(!win.isFullScreen());
  };

  wc.on("before-input-event", (ev: Electron.Event, input: Electron.Input) => {
    if (input.type === "keyDown") {
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
            wc.openDevTools({ mode: "detach" });
          }
          break;
      }
    }
  });

  wc.on("new-window", (ev: Event, url: string) => {
    ev.preventDefault();
    shell.openExternal(url);
  });

  // don't use the HTTP cache, we already have everything on disk!
  const options = {
    extraHeaders: "pragma: no-cache\n",
  };

  win.loadURL(`itch-cave://game.itch/${indexPath}`, options);

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

function generateInject(itchObject: Object): string {
  return `(function() {
      try {
        console.log(
          "%c ========== Loading itch app HTML5 environment ===========",
          "color: #fa5c5c"
        );
        if (!navigator.languages || !navigator.languages.length) {
          console.log("Patching navigator.languages...");
          Object.defineProperty(navigator, "languages", {
            value: [navigator.language, "en-US"],
            configurable: true,
          });
        }

        window.Itch = ${JSON.stringify(itchObject)};
        console.log("Loaded itch environment!");
        console.dir(window.Itch);
      } catch (e) {
        console.error("While loading itch environment: ", e);
      } finally {
        console.log(
          "%c =========================================================",
          "color: #fa5c5c"
        );
      }
    })();`;
}
