import querystring from "querystring";
import urlParser from "url";
import { contextBridge } from "electron";

declare function atob(b64: string): string;

interface Env {
  [key: string]: string;
}

interface Itch {
  env: Env;
  args: string[];
}

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
    const Itch: Itch = JSON.parse(jsonSource);
    contextBridge.exposeInMainWorld("Itch", Itch);
    console.log("Loaded itch environment!");
    console.dir(Itch);
  } catch (e) {
    console.error("While loading itch environment: ", e);
  } finally {
    console.log(
      "%c =========================================================",
      "color: #fa5c5c"
    );
  }
})();
