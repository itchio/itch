import { ExtendedWebContents } from "common/extended-web-contents";
import { modals } from "common/modals";
import { packets } from "common/packets";
import dump from "common/util/dump";
import { WebContents, webContents } from "electron";
import { MainState } from "main";
import { envSettings } from "main/constants/env-settings";
import { mainLogger } from "main/logger";
import { showModal } from "main/show-modal";
import { broadcastPacket } from "main/socket-handler";

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
  tokens.push(input.key);
  return tokens.join("+").toLowerCase();
}

function inputMatches(specIn: string, inputString: string): boolean {
  let spec = specIn.toLowerCase();
  if (spec === inputString) {
    return true;
  }
  if (spec.replace("cmdorctrl", "ctrl") === inputString) {
    return true;
  }
  if (spec.replace("cmdorctrl", "cmd") === inputString) {
    return true;
  }
  return false;
}

type Action = (ms: MainState) => Promise<void>;

type Shortcut = [string[], Action];

type Shortcuts = Shortcut[];

const mainWindowShortcuts: Shortcuts = [
  [
    ["CmdOrCtrl+Shift+C"],
    async (ms) => openOrFocusDevTools(ms.browserWindow?.webContents),
  ],
  [
    ["CmdOrCtrl+Alt+Shift+C", "CmdOrCtrl+Shift+I"],
    async (ms) => openOrFocusDevTools(getWebviewWebContents(ms)),
  ],
  [["CmdOrCtrl+Q"], async (ms) => ms.browserWindow?.close()],
  [
    ["Shift+F5"],
    async (ms) => ms.browserWindow?.webContents?.reloadIgnoringCache(),
  ],
  [["F5", "CmdOrCtrl+R"], async (ms) => getWebviewWebContents(ms)?.reload()],
  [
    ["CmdOrCtrl+F5", "CmdOrCtrl+Shift+R"],
    async (ms) => getWebviewWebContents(ms)?.reloadIgnoringCache(),
  ],
  [
    ["Alt+ArrowLeft"],
    async (ms) => webContentsGoBack(getWebviewWebContents(ms)),
  ],
  [
    ["Alt+ArrowRight"],
    async (ms) => webContentsGoForward(getWebviewWebContents(ms)),
  ],
  [
    ["CmdOrCtrl+,"],
    async (ms) => {
      await showModal(ms, modals.preferences, {});
    },
  ],
  [
    ["CmdOrCtrl+F"],
    async (ms) => {
      await broadcastPacket(ms, packets.openSearch, {});
    },
  ],
];

function getWebviewWebContents(ms: MainState): WebContents | undefined {
  let winId = ms.browserWindow?.webContents?.id;
  for (const wc of webContents.getAllWebContents()) {
    if (wc.hostWebContents?.id == winId) {
      return wc;
    }
  }
  return undefined;
}

export function openOrFocusDevTools(wc: WebContents | undefined) {
  wc?.openDevTools({ mode: "detach" });
  wc?.devToolsWebContents?.focus();
}

function webContentsGoBack(wc: WebContents | undefined) {
  if (!wc) {
    return;
  }
  let ewc = wc as ExtendedWebContents;
  let newIndex = ewc.currentIndex - 1;
  if (newIndex >= 0) {
    wc.goToIndex(newIndex);
  }
}

function webContentsGoForward(wc: WebContents | undefined) {
  if (!wc) {
    return;
  }
  let ewc = wc as ExtendedWebContents;
  let newIndex = ewc.currentIndex + 1;
  if (newIndex < ewc.history.length) {
    wc.goToIndex(newIndex);
  }
}

export function setupCustomShortcuts(
  ms: MainState,
  wc: WebContents,
  shortcuts: Shortcuts
) {
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
        let [specs, action] = shortcut;
        for (const spec of specs) {
          if (inputMatches(spec, inputString)) {
            ev.preventDefault();
            logger.info(`Triggering shortcut ${shortcut[0]}`);
            action(ms).catch((e) => {
              logger.warn(`Error in shortcut ${shortcut[0]}: ${e.stack}`);
            });
            return;
          }
        }
      }
    } catch (e) {
      logger.warn(`While processing shortcuts: ${e.stack}`);
      logger.warn(`Input was ${dump(input)}`);
    }
    // muffin
  });
}

export function setupShortcuts(ms: MainState, wc: WebContents) {
  setupCustomShortcuts(ms, wc, mainWindowShortcuts);
}
