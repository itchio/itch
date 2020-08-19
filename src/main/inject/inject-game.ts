import querystring from "querystring";
import urlParser from "url";
import { webFrame } from "electron";

declare function atob(b64: string): string;

interface Env {
  [key: string]: string;
}

interface Itch {
  env: Env;
  args: string[];
}

type ExtendedGlobal = typeof global & {
  Itch: Itch;
};
const extendedGlobal = global as ExtendedGlobal;

(function () {
  try {
    console.log(
      "%c ========== Loading itch app HTML5 environment ===========",
      "color: #fa5c5c"
    );
    if (!navigator.languages || !navigator.languages.length) {
      console.log("Patching navigator.languages...");
      Object.defineProperty(navigator, "languages", {
        value: [navigator.language, "en-US"],
        configurable: true,
      });
    }

    const url = urlParser.parse(window.location.href);
    console.log("Parsed url: ", url);

    const parsedQuery = querystring.parse(url.query);
    console.log("Referrer query: ", parsedQuery);

    const itchObjectBase64 = parsedQuery.itchObject;
    const jsonSource = atob(
      Array.isArray(itchObjectBase64) ? itchObjectBase64[0] : itchObjectBase64
    );
    extendedGlobal.Itch = JSON.parse(jsonSource);
    console.log("Loaded itch environment!");
    console.dir(extendedGlobal.Itch);
  } catch (e) {
    console.error("While loading itch environment: ", e);
  } finally {
    console.log(
      "%c =========================================================",
      "color: #fa5c5c"
    );
  }
})();
