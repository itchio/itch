import { getErrorMessage, getErrorCode } from "common/butlerd/errors";
import { actions } from "common/actions";
import { PreferencesState, Store } from "common/types";
import { Watcher } from "common/util/watcher";
import { mainLogger } from "main/logger";
import ospath from "path";
import { createSelector } from "reselect";
import { exists, mkdir, readFile, unlink, writeFile } from "main/os/sf";

const logger = mainLogger.child(__filename);

// Append " --hidden" to the Exec= line of a .desktop file. Used only when
// writing the autostart copy so that login-triggered launches start hidden
// while manual launches via menu/icon still show a window. The flag is read
// in main/reactors/winds.ts via process.argv.
function injectHiddenFlag(desktopContents: string): string {
  return desktopContents.replace(
    /^(Exec=.*?)(\s*)$/m,
    (_match, exec, trailing) => `${exec} --hidden${trailing}`
  );
}

async function findInstalledDesktopFile(
  desktopFileName: string
): Promise<string | null> {
  const app = require("electron").app;
  const xdgDataHome =
    process.env.XDG_DATA_HOME ||
    ospath.join(app.getPath("home"), ".local", "share");
  const candidates = [
    ospath.join(xdgDataHome, "applications", desktopFileName),
    ospath.join("/usr/share/applications", desktopFileName),
  ];
  for (const path of candidates) {
    if (await exists(path)) {
      return path;
    }
  }
  return null;
}

async function updateOpenAtLoginState(
  store: Store,
  openAtLogin: boolean,
  openAsHidden: boolean,
  isInitialApply: boolean
) {
  logger.debug(
    `Updating login item settings, open=${openAtLogin}, hidden=${openAsHidden}, initial=${isInitialApply}`
  );

  const app = require("electron").app;

  if (process.platform === "linux") {
    // cf. https://standards.freedesktop.org/autostart-spec/autostart-spec-latest.html#startup
    const configHome =
      process.env.XDG_CONFIG_HOME ||
      ospath.join(app.getPath("home"), ".config");
    const autostartDir = ospath.join(configHome, "autostart");
    const desktopFileName = `io.itch.${app.getName()}.desktop`;
    const autostartFilePath = ospath.join(autostartDir, desktopFileName);

    if (openAtLogin) {
      try {
        const desktopFilePath = await findInstalledDesktopFile(desktopFileName);
        if (!desktopFilePath) {
          store.dispatch(
            actions.openAtLoginError({ error: { cause: "no_desktop_file" } })
          );
          return;
        }

        logger.debug(`Copying ${desktopFilePath} => ${autostartFilePath}`);

        if (!(await exists(autostartDir))) {
          await mkdir(autostartDir);
        }

        const desktopContents = await readFile(desktopFilePath, {
          encoding: "utf8",
        });
        const autostartContents = openAsHidden
          ? injectHiddenFlag(desktopContents)
          : desktopContents;
        if (await exists(autostartFilePath)) {
          await unlink(autostartFilePath);
        }

        await writeFile(autostartFilePath, autostartContents, {
          encoding: "utf8",
        });
      } catch (err) {
        logger.error(
          `Error while writing ${autostartFilePath}: ${getErrorMessage(err)}`
        );
        store.dispatch(
          actions.openAtLoginError({
            error: {
              cause: "error",
              message: getErrorMessage(err),
            },
          })
        );
        return;
      }
    } else {
      // Don't unlink on the initial preferencesLoaded apply: the default for
      // openAtLogin is false, and the autostart file we'd be deleting may have
      // been placed there by the user manually (cf. issue #3311). Only unlink
      // when the user actually toggles openAtLogin off during the session.
      if (isInitialApply) {
        return;
      }
      try {
        await unlink(autostartFilePath);
      } catch (err) {
        if (getErrorCode(err) === "ENOENT") {
          // not even there, good!
        } else {
          logger.error(
            `Error while unlinking ${autostartFilePath}: ${getErrorMessage(
              err
            )}`
          );
          return;
        }
      }

      store.dispatch(actions.openAtLoginError({ error: null }));
    }
  } else {
    // macOS, Windows
    const settings: any = { openAtLogin };
    if (process.platform === "win32") {
      settings.openAsHidden = openAsHidden;
    }
    app.setLoginItemSettings(settings);
  }
}

let cachedSelector: (prefs: PreferencesState) => void;
let isInitialApply = true;
function getSelector(store: Store) {
  if (!cachedSelector) {
    cachedSelector = createSelector(
      (prefs: PreferencesState) => prefs.openAtLogin,
      (prefs: PreferencesState) => prefs.openAsHidden,
      (openAtLogin: boolean, openAsHidden: boolean) => {
        const initial = isInitialApply;
        isInitialApply = false;
        updateOpenAtLoginState(store, openAtLogin, openAsHidden, initial);
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
