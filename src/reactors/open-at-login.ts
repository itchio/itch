import { Watcher } from "./watcher";
import { actions } from "../actions";

import * as os from "../os";
import * as sf from "../os/sf";
import * as ospath from "path";

import rootLogger from "../logger";
const logger = rootLogger.child({ name: "open-at-login" });

import { createSelector } from "reselect";

import { IStore, IPreferencesState } from "../types";

async function updateOpenAtLoginState(
  store: IStore,
  openAtLogin: boolean,
  openAsHidden: boolean
) {
  logger.debug(
    `Updating login item settings, open=${openAtLogin}, hidden=${openAsHidden}`
  );

  const app = require("electron").app;

  if (os.platform() === "linux") {
    // cf. https://standards.freedesktop.org/autostart-spec/autostart-spec-latest.html#startup
    const configHome =
      process.env.XDG_CONFIG_HOME ||
      ospath.join(app.getPath("home"), ".config", "autostart");
    const desktopFileName = `io.itch.${app.getName()}.desktop`;
    const desktopFilePath = ospath.join(
      "/usr/share/applications",
      desktopFileName
    );
    const autostartFilePath = ospath.join(configHome, desktopFileName);

    logger.info(`Copying ${desktopFilePath} => ${autostartFilePath}`);

    if (openAtLogin) {
      try {
        if (!await sf.exists(desktopFilePath)) {
          store.dispatch(
            actions.openAtLoginError({ cause: "no_desktop_file" })
          );
          return;
        }

        if (!await sf.exists(configHome)) {
          await sf.mkdir(configHome);
        }

        const desktopContents = await sf.readFile(desktopFilePath, {
          encoding: "utf8",
        });
        if (await sf.exists(autostartFilePath)) {
          await sf.unlink(autostartFilePath);
        }

        await sf.writeFile(autostartFilePath, desktopContents, {
          encoding: "utf8",
        });
      } catch (err) {
        logger.error(
          `Error while symlinking ${autostartFilePath}: ${err.message}`
        );
        store.dispatch(
          actions.openAtLoginError({ cause: "error", message: err.message })
        );
        return;
      }
    } else {
      try {
        await sf.unlink(autostartFilePath);
      } catch (err) {
        if (err.code === "ENOENT") {
          // not even there, good!
        } else {
          logger.error(
            `Error while unlinking ${autostartFilePath}: ${err.message}`
          );
          return;
        }
      }

      store.dispatch(actions.openAtLoginError(null));
    }
  } else {
    // macOS, Windows
    app.setLoginItemSettings({
      openAtLogin: openAtLogin,
      openAsHidden: openAsHidden,
    });
  }
}

let cachedSelector: (prefs: IPreferencesState) => void;
function getSelector(store: IStore) {
  if (!cachedSelector) {
    cachedSelector = createSelector(
      (prefs: IPreferencesState) => prefs.openAtLogin,
      (prefs: IPreferencesState) => prefs.openAsHidden,
      (openAtLogin: boolean, openAsHidden: boolean) => {
        updateOpenAtLoginState(store, openAtLogin, openAsHidden);
      }
    );
  }

  return cachedSelector;
}

export default function(watcher: Watcher) {
  watcher.on(actions.updatePreferences, async (store, action) => {
    const selector = getSelector(store);
    selector(store.getState().preferences);
  });
}
