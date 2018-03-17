import * as querystring from "querystring";
import * as urlParser from "url";

// only load outside of electron
const sendMessage = (action: string) => {
  const url = `https://itch-internal/${action}`;
  const xhr = new XMLHttpRequest();
  xhr.open("POST", url);
  xhr.send();
};

window.addEventListener("keydown", (e: KeyboardEvent) => {
  switch (e.key) {
    case "F11":
      sendMessage("toggle-fullscreen");
      break;
    case "F":
      if (!e.metaKey) {
        return;
      }
      sendMessage("toggle-fullscreen");
      break;
    case "Escape":
      sendMessage("exit-fullscreen");
      break;
    case "F12":
      if (!e.shiftKey) {
        return;
      }
      sendMessage("open-devtools");
      break;
    default:
      break;
  }
});

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

(function() {
  try {
    console.log(
      "%c ========== Loading itch app HTML5 environment ===========",
      "color: #fa5c5c"
    );
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
