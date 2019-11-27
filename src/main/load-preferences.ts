import { MainState, LocalesConfig } from "main";
import { preferencesPath } from "common/util/paths";
import { readJSONFile, writeJSONFile } from "main/fs";
import { getLocalePath, getLocalesConfigPath } from "common/util/resources";
import { LocaleStrings } from "common/locales";
import { mainLogger } from "main/logger";

let logger = mainLogger.childWithName("load-preferences");

export interface PreferencesState {
  /** where to install games by default */
  defaultInstallLocation: string;

  /** use sandbox */
  isolateApps: boolean;

  /** when closing window, keep running in tray */
  closeToTray: boolean;

  /** notify when a download has been installed or updated */
  readyNotification: boolean;

  /** show the advanced section of settings */
  showAdvanced: boolean;

  /** language picked by the user */
  lang: string;

  /** if true, user's already seen the 'minimize to tray' notification */
  gotMinimizeNotification: boolean;

  /** should the itch app start on os startup? */
  openAtLogin: boolean;

  /** when the itch app starts at login, should it be hidden? */
  openAsHidden: boolean;

  /** show consent dialog before applying any game updates */
  manualGameUpdates: boolean;

  /** prevent display sleep while playing */
  preventDisplaySleep: boolean;

  /** layout to use to show games */
  layout: TabLayout;

  /** disable GPU acceleration, see #809 */
  disableHardwareAcceleration: boolean;
}

export type TabLayout = "grid" | "table";

function normalizeLang(mainState: MainState, lang: string): string {
  let list = mainState.localesConfig ? mainState.localesConfig.locales : [];

  if (list.find(x => x.value == lang)) {
    return lang;
  }

  lang = lang.slice(0, 2);
  if (list.find(x => x.value == lang)) {
    return lang;
  }

  return "en";
}

export async function loadPreferences(mainState: MainState) {
  let preferences: PreferencesState = await readJSONFile(preferencesPath());
  let localesConfig: LocalesConfig = await readJSONFile(getLocalesConfigPath());

  let englishStrings: LocaleStrings = await readJSONFile(
    getLocalePath(`en.json`)
  );
  logger.info(
    `Loaded ${Object.keys(englishStrings).length} strings for English locale`
  );

  mainState.preferences = preferences;
  mainState.localesConfig = localesConfig;
  mainState.localeState = {
    englishStrings,
    current: {
      lang: "en",
      strings: englishStrings,
    },
  };

  await loadLocale(mainState, preferences.lang);
}

export async function loadLocale(mainState: MainState, lang: string) {
  if (!mainState.localeState) {
    throw new Error(`loadLocale called before mainState.localeState is set`);
  }

  let normalizedLang = normalizeLang(mainState, lang);
  if (normalizedLang == "en") {
    logger.info(`Unknown lang ${lang}, not loading`);
    let { englishStrings } = mainState.localeState;
    mainState.localeState.current = {
      lang: "en",
      strings: englishStrings,
    };
    return;
  }

  let strings: LocaleStrings = await readJSONFile(
    getLocalePath(`${normalizedLang}.json`)
  );
  logger.info(
    `Loaded ${
      Object.keys(strings).length
    } strings from ${normalizedLang} for ${lang}`
  );
  mainState.localeState.current = {
    lang: normalizedLang,
    strings,
  };
}

export async function setPreferences(
  mainState: MainState,
  values: Partial<PreferencesState>
) {
  if (!mainState.preferences) {
    throw new Error(`setPreferences called before preferences were loaded`);
  }

  mainState.preferences = {
    ...mainState.preferences,
    ...values,
  };

  await writeJSONFile(preferencesPath(), mainState.preferences);
}
