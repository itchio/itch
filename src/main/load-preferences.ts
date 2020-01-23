import { MainState, LocalesConfig } from "main";
import { preferencesPath } from "common/util/paths";
import { readJSONFile, writeJSONFile } from "main/fs";
import { getLocalePath, getLocalesConfigPath } from "common/util/resources";
import { LocaleStrings } from "common/locales";
import { mainLogger } from "main/logger";
import { PreferencesState } from "common/preferences";
import { broadcastPacket } from "main/websocket-handler";
import { packets } from "common/packets";

let logger = mainLogger.childWithName("load-preferences");

function normalizeLang(ms: MainState, lang: string): string {
  let list = ms.localesConfig ? ms.localesConfig.locales : [];

  if (list.find(x => x.value == lang)) {
    return lang;
  }

  lang = lang.slice(0, 2);
  if (list.find(x => x.value == lang)) {
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
  let localesConfig: LocalesConfig = await readJSONFile(getLocalesConfigPath());

  let englishStrings: LocaleStrings = processLocaleStrings(
    await readJSONFile(getLocalePath(`en.json`))
  );
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
    await loadLocale(ms, preferences.lang);
  }
}

function processLocaleStrings(input: LocaleStrings): LocaleStrings {
  let output: LocaleStrings = {};
  for (const k of Object.keys(input)) {
    output[k] = input[k].replace(/{{/g, "{").replace(/}}/g, "}");
  }
  return output;
}

export async function loadLocale(ms: MainState, lang: string) {
  if (!ms.localeState) {
    throw new Error(`loadLocale called before MainState.localeState is set`);
  }

  let normalizedLang = normalizeLang(ms, lang);
  if (normalizedLang == "en") {
    logger.info(`Returning English strings for lang ${normalizedLang}`);
    let { englishStrings } = ms.localeState;
    ms.localeState.current = {
      lang: "en",
      strings: englishStrings,
    };
    return;
  }

  let strings: LocaleStrings = processLocaleStrings(
    await readJSONFile(getLocalePath(`${normalizedLang}.json`))
  );
  logger.info(
    `Loaded ${
      Object.keys(strings).length
    } strings from (${normalizedLang}) for (${lang}) locale`
  );
  ms.localeState.current = {
    lang: normalizedLang,
    strings,
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
}
