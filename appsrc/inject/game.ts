
// tslint:disable:no-console

import * as querystring from "querystring";
import * as urlParser from "url";

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
})

; (function () {
  try {
    const url = urlParser.parse(window.location.href);
    console.log("Parsed url: ", url);
    const parsedQuery = querystring.parse(url.query);
    console.log("Referrer query: ", parsedQuery);
    const itchObjectBase64 = parsedQuery.itchObject;
    (global as any).Itch = JSON.parse((global as any).atob(itchObjectBase64));
    console.log("Loaded itch environment");
  } catch (e) {
    console.log("While loading itch environment: ", e);
  }
})();

window.addEventListener("DOMContentLoaded", (e) => {
  const gm4 = document.querySelectorAll("div.gm4html5_div_class");
  const emscripten = document.querySelectorAll("canvas.emscripten");
  if (gm4.length + emscripten.length === 0) {
    console.log("Didn\'t detect emscripten or gm4, not trying to fit to window");
    return;
  }

  const pico8 = document.querySelectorAll("div.pico8_el");
  if (pico8.length > 0) {
    console.log("Detected pico8, not trying to fit to window");
    return;
  }

  const canvases = document.getElementsByTagName("canvas");
  if (canvases.length !== 1) {
    console.log("Didn\'t find exactly 1 canvas, not trying to fit to window");
  }
  const canvas = canvases[0];

  const refitCanvas = function () {
    if (window.innerHeight > 0) {
      document.body.style.overflow = "hidden";
      canvas.style.zIndex = "1000";
      canvas.style.position = "fixed";
      canvas.style.margin = "0";

      const ratio = canvas.width / canvas.height;
      canvas.style.height = window.innerHeight + "px";

      const stretchWidth = window.innerHeight * ratio;
      const horizontalMargin = (window.innerWidth - stretchWidth) / 2;

      canvas.style.top = "0";
      canvas.style.left = horizontalMargin.toFixed() + "px";

      let parent = canvas.parentNode as HTMLElement;
      while (parent && parent.style) {
        parent.style.transform = "none";
        (parent.style as any)["webkit-transform"] = "none";
        parent = parent.parentNode as HTMLElement;
      }
    }
  };
  window.onresize = refitCanvas;
  refitCanvas();
});
