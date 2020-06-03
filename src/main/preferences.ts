import { MainState, LocalesConfig } from "main";
import { preferencesPath } from "common/util/paths";
import {
  readJSONFile,
  writeJSONFile,
  readFile,
  exists,
  writeFile,
} from "main/fs";
import { LocaleStrings } from "common/locales";
import { mainLogger } from "main/logger";
import { PreferencesState } from "common/preferences";
import { broadcastPacket } from "main/socket-handler";
import { packets } from "common/packets";
import { app } from "electron";
import { join } from "path";
import { unlink } from "main/fs";
import * as locales from "main/locales";
import _ from "lodash";

const wasOpenedAtLoginFlag = "--wasOpenedAtLogin";

let logger = mainLogger.childWithName("load-preferences");

function normalizeLang(ms: MainState, lang: string): string {
  let list = ms.localesConfig ? ms.localesConfig.locales : [];

  if (list.find((x) => x.value == lang)) {
    return lang;
  }

  lang = lang.slice(0, 2);
  if (list.find((x) => x.value == lang)) {
    return lang;
  }

  return "en";
}

export async function loadPreferences(ms: MainState) {
  let preferences: PreferencesState;
  try {
    preferences = await readJSONFile(preferencesPath());
  } catch (e) {
    logger.info(`No preferences, using defaults`);
    preferences = {
      lang: "en",
      gotMinimizeNotification: false,
      disableHardwareAcceleration: false,
      layout: "table",
      defaultInstallLocation: "appdata",
      isolateApps: false,
      closeToTray: true,
      readyNotification: true,
      showAdvanced: false,
      openAtLogin: false,
      openAsHidden: false,
      manualGameUpdates: false,
      preventDisplaySleep: true,
    };
  }
  let localesConfig: LocalesConfig = locales.list;

  let englishStrings: LocaleStrings = processLocaleStrings(locales.strings.en);
  logger.debug(
    `Loaded ${Object.keys(englishStrings).length} strings for base locale (en)`
  );

  ms.preferences = preferences;
  ms.localesConfig = localesConfig;
  ms.localeState = {
    englishStrings,
    current: {
      lang: "en",
      strings: englishStrings,
    },
  };

  if (preferences.lang) {
    loadLocale(ms, preferences.lang);
  }
}

function processLocaleStrings(input: LocaleStrings): LocaleStrings {
  let output: LocaleStrings = {};
  for (const k of Object.keys(input)) {
    output[k] = input[k]
      .replace(/'{{/g, "{{")
      .replace(/}}'/g, "}}")
      .replace(/{{/g, "{")
      .replace(/}}/g, "}");
  }
  return output;
}

export function loadLocale(ms: MainState, lang: string) {
  if (!ms.localeState) {
    throw new Error(`loadLocale called before MainState.localeState is set`);
  }
  let { englishStrings } = ms.localeState;

  let normalizedLang = normalizeLang(ms, lang);
  if (normalizedLang == "en") {
    logger.info(`Returning English strings for lang ${normalizedLang}`);
    ms.localeState.current = {
      lang: "en",
      strings: englishStrings,
    };
    return;
  }

  let strings: LocaleStrings = processLocaleStrings(
    locales.strings[normalizedLang] || Promise.resolve({})
  );
  logger.info(
    `Loaded ${
      Object.keys(strings).length
    } strings from (${normalizedLang}) for (${lang}) locale`
  );
  ms.localeState.current = {
    lang: normalizedLang,
    strings: {
      ...englishStrings,
      ...strings,
    },
  };
}

export async function setPreferences(
  ms: MainState,
  values: Partial<PreferencesState>
) {
  if (!ms.preferences) {
    throw new Error(`setPreferences called before preferences were loaded`);
  }

  ms.preferences = {
    ...ms.preferences,
    ...values,
  };

  await writeJSONFile(preferencesPath(), ms.preferences);
  broadcastPacket(ms, packets.preferencesUpdated, { preferences: values });

  if (
    typeof values.openAtLogin !== "undefined" ||
    typeof values.openAsHidden !== "undefined"
  ) {
    try {
      await setOpenAtLogin(ms.preferences);
    } catch (e) {
      logger.warn(`While applying autostart preferences:${e.stack}`);
    }
  }
}

async function setOpenAtLogin(prefs: PreferencesState) {
  const { openAsHidden, openAtLogin } = prefs;

  if (process.platform === "linux") {
    await setOpenAtLoginLinux(prefs);
  } else {
    app.setLoginItemSettings({
      openAsHidden,
      openAtLogin,
    });
  }
}

function xdgDataHome(): string {
  return (
    process.env.XDG_DATA_HOME ?? join(app.getPath("home"), ".local", "share")
  );
}

function xdgConfigHome(): string {
  return process.env.XDG_CONFIG_HOME ?? join(app.getPath("home"), ".config");
}

function xdgApplicationsDir(): string {
  return join(xdgDataHome(), "applications");
}

function xdgAutoStartDir(): string {
  return join(xdgConfigHome(), "autostart");
}

function desktopFileName(): string {
  return `io.itch.${app.name}.desktop`;
}

async function setOpenAtLoginLinux(prefs: PreferencesState) {
  const appPath = join(xdgApplicationsDir(), desktopFileName());
  const autoPath = join(xdgAutoStartDir(), desktopFileName());

  logger.debug(`Open at login paths:`);
  logger.debug(`(${autoPath}) => (${appPath})`);

  if (!prefs.openAtLogin) {
    logger.info(`Disabling autostart...`);
    if (await exists(autoPath)) {
      logger.info(`Removing (${autoPath})`);
      await unlink(autoPath);
    } else {
      logger.info(`Already disabled, (${autoPath}) does not exist`);
    }
    return;
  }

  logger.info(`Enabling autostart`);
  if (await exists(autoPath)) {
    logger.info(`Removing (${autoPath})`);
    await unlink(autoPath);
  }

  const desktopContents = await readFile(appPath, "utf8");
  const lines = desktopContents.split("\n");
  const execIndex = _.findIndex(lines, (l) => l.startsWith("Exec="));
  if (execIndex === -1) {
    throw new Error(`.desktop file does not contain "Exec=" line`);
  }
  lines[execIndex] = `${lines[execIndex]} ${wasOpenedAtLoginFlag}`;
  const newDesktopContents = lines.join("\n");
  logger.info(`Writing (${autoPath})`);
  await writeFile(autoPath, newDesktopContents, "utf8");
}

export function wasOpenedAsHidden(ms: MainState): boolean {
  if (process.platform === "linux") {
    if (!_.includes(process.argv, wasOpenedAtLoginFlag)) {
      return false;
    }
  } else {
    if (!app.getLoginItemSettings().wasOpenedAtLogin) {
      return false;
    }
  }
  let openAsHidden = ms.preferences?.openAsHidden ?? false;
  return openAsHidden;
}
