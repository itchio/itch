import { BrowserWindow, WebContents, webContents } from "electron";
import { MainState } from "main";
import { envSettings } from "main/constants/env-settings";
import { mainLogger } from "main/logger";
import dump from "common/util/dump";

const logger = mainLogger.childWithName("shortcuts");

function inputToString(input: Electron.Input): string {
  let tokens = [];
  if (input.control) {
    tokens.push("Ctrl");
  }
  if (input.meta) {
    tokens.push("Cmd");
  }
  if (input.alt) {
    tokens.push("Alt");
  }
  if (input.shift) {
    tokens.push("Shift");
  }
  tokens.push(input.key.toLowerCase());
  return tokens.join("+");
}

function inputMatches(spec: string, inputString: string): boolean {
  if (spec === inputString) {
    return true;
  }
  if (spec.replace("CmdOrCtrl", "Ctrl") === inputString) {
    return true;
  }
  if (spec.replace("CmdOrCtrl", "Cmd") === inputString) {
    return true;
  }
  return false;
}

type Action = (ms: MainState) => Promise<void>;

type Shortcut = [string, Action];

type Shortcuts = Shortcut[];

const shortcuts: Shortcuts = [
  ["CmdOrCtrl+Shift+c", openDevTools],
  ["CmdOrCtrl+Alt+Shift+c", openWebviewDevTools],
];

async function openDevTools(ms: MainState) {
  const wc = ms.browserWindow?.webContents;
  wc?.openDevTools({ mode: "detach" });
  wc?.devToolsWebContents?.focus();
}

async function openWebviewDevTools(ms: MainState) {
  let winId = ms.browserWindow?.webContents?.id;
  for (const wc of webContents.getAllWebContents()) {
    if (wc.hostWebContents?.id == winId) {
      wc.openDevTools({ mode: "detach" });
      wc.devToolsWebContents?.focus();
      return;
    }
  }
}

export function setupShortcuts(ms: MainState, wc: WebContents) {
  logger.info(`Setting up shortcuts for webContents ${wc.id}`);

  wc.on("before-input-event", (ev, input) => {
    try {
      if (input.isAutoRepeat) {
        return;
      }

      let inputString = inputToString(input);
      if (envSettings.logInputs) {
        logger.info(`Pressed: ${inputString}`);
      }

      for (const shortcut of shortcuts) {
        let [spec, action] = shortcut;
        if (inputMatches(spec, inputString)) {
          ev.preventDefault();
          action(ms).catch(e => {
            logger.warn(`Error in shortcut ${shortcut[0]}: ${e.stack}`);
          });
          return;
        }
      }
    } catch (e) {
      logger.warn(`While processing shortcuts: ${e.stack}`);
      logger.warn(`Input was ${dump(input)}`);
    }
    // muffin
  });
}
