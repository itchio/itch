
import {II18nResources} from "../types";

const emptyObj = {};

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
    if (!key || key.length <= 0) {
      return key;
    }

    const longLocale = lang.length > 2;
    const keyArray = Array.isArray(key);

    let str: string;
    langLookup: for (let i = 0; i < 3; i++) {
      let currentLang;
      if (i === 0) {
        currentLang = lang;
      } else if (i === 1) {
        if (longLocale) {
          currentLang = lang.substring(0, 2);
        } else {
          continue;
        }
      } else if (i === 2) {
        currentLang = "en";
      }

      const currentStrings = strings[currentLang] || emptyObj;
      if (keyArray) {
        for (const currentKey of key) {
          str = currentStrings[currentKey];
          if (str) {
            break langLookup;
          }
        }
      } else {
        str = currentStrings[key as string];
        if (str) {
          break langLookup;
        }
      }
    }

    if (!str) {
      // fall back to specified default value, or key name +
      // variables stringified as json
      let defaultValue = (variables || emptyObj).defaultValue;
      if (!defaultValue) {
        let defaultSuffix = "";
        if (Object.keys(variables || emptyObj).length > 0) {
          defaultSuffix = ` ${JSON.stringify(variables)}`;
        }
        defaultValue = `${key}${defaultSuffix}`;
      }
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
