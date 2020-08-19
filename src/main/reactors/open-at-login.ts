import { actions } from "common/actions";
import { PreferencesState, Store } from "common/types";
import { Watcher } from "common/util/watcher";
import { mainLogger } from "main/logger";
import ospath from "path";
import { createSelector } from "reselect";
import { exists, mkdir, readFile, unlink, writeFile } from "main/os/sf";

const logger = mainLogger.child(__filename);

async function updateOpenAtLoginState(
  store: Store,
  openAtLogin: boolean,
  openAsHidden: boolean
) {
  logger.debug(
    `Updating login item settings, open=${openAtLogin}, hidden=${openAsHidden}`
  );

  const app = require("electron").app;

  if (process.platform === "linux") {
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

    logger.debug(`Copying ${desktopFilePath} => ${autostartFilePath}`);

    if (openAtLogin) {
      try {
        if (!(await exists(desktopFilePath))) {
          store.dispatch(
            actions.openAtLoginError({ cause: "no_desktop_file" })
          );
          return;
        }

        if (!(await exists(configHome))) {
          await mkdir(configHome);
        }

        const desktopContents = await readFile(desktopFilePath, {
          encoding: "utf8",
        });
        if (await exists(autostartFilePath)) {
          await unlink(autostartFilePath);
        }

        await writeFile(autostartFilePath, desktopContents, {
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
        await unlink(autostartFilePath);
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

let cachedSelector: (prefs: PreferencesState) => void;
function getSelector(store: Store) {
  if (!cachedSelector) {
    cachedSelector = createSelector(
      (prefs: PreferencesState) => prefs.openAtLogin,
      (prefs: PreferencesState) => prefs.openAsHidden,
      (openAtLogin: boolean, openAsHidden: boolean) => {
        updateOpenAtLoginState(store, openAtLogin, openAsHidden);
      }
    );
  }

  return cachedSelector;
}

export default function (watcher: Watcher) {
  watcher.on(actions.updatePreferences, async (store, action) => {
    const selector = getSelector(store);
    selector(store.getState().preferences);
  });
}
