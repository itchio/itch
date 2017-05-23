
import {II18nResources} from "../types";

export interface ILocalizer {
  /** returns the localized version of a string */
  (key: string | string[], variables?: any): string;

  /** language this localizer is localizing in */
  lang: string;

  /** format accepts either a string or an array of [key, variables] */
  format(args: any): string;
}

export function getT (strings: II18nResources, lang: string) {
  const t: ILocalizer = ((key: string | string[], variables?: any) => {
    let langs = [lang];
    if (lang.length > 2) {
      langs = [...langs, lang.substring(0, 2)];
    }
    
    langs = [...langs, "en"];
    const keys = Array.isArray(key) ? key : [key];
    if (process.type === "renderer") {
      throw new Error("test error in localizer");
    }
    if (key.length < 1) {
      return key;
    }

    let str: string;
    for (const localeLang of langs) {
      for (const localeKey of keys) {
        const lstrings = strings[localeLang] || {};
        str = lstrings[localeKey];
        if (str) {
          break;
        }
      }

      if (str) {
        break;
      }
    }

    if (!str) {
      // fall back to specified default value, or key name +
      // variables stringified as json
      let defaultSuffix = "";
      if (Object.keys(variables || {}).length > 0) {
        defaultSuffix = ` ${JSON.stringify(variables || {})}`;
      }
      let defaultValue = (variables || {}).defaultValue || `${key}${defaultSuffix}`;
      return defaultValue;
    }

    if (variables) {
      let result = str;
      for (const varName of Object.keys(variables)) {
        // TODO: pre-parse strings for performance?
        // also this will leave {{blah}} in strings if they
        // don't have corresponding variables
        result = result.replace(new RegExp("{{" + varName + "}}", "g"), variables[varName]);
      }
      return result;
    } else {
      return str;
    }
  }) as any;

  t.lang = lang;

  t.format = (args) => {
    if (Array.isArray(args)) {
      return t.apply(null, args);
    } else {
      return args;
    }
  };

  return t;
}

export default { getT };
