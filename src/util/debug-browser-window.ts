
import rootLogger from "../logger";
const logger = rootLogger.child({name: "debug-browser-window"});

/**
 * Gives us some log of what happens in the browser window, helps debugging the flow
 */
function enableEventDebugging (prefix: string, win: any) {
  let events = "page-title-updated close closed unresponsive responsive blur focus maximize" +
    " unmaximize minimize restore resize move moved enter-full-screen enter-html-full-screen" +
    " leave-html-full-screen app-command";
  events.split(" ").forEach((ev) => {
    win.on(ev, (e: any, deets: any) => {
      logger.debug(`${prefix} window event: ${ev}, ${JSON.stringify(deets, null, 2)}`);
    });
  });

  let cevents = "did-finish-load did-fail-load did-frame-finish-load did-start-loading" +
    " did-stop-loading did-get-response-details did-get-redirect-request dom-ready" +
    " page-favicon-updated new-window will-navigate crashed plugin-crashed destroyed";
  cevents.split(" ").forEach((ev) => {
    win.webContents.on(ev, (e: any, ...args: any[]) => {
      logger.debug(`${prefix} webcontents event: ${ev}, ${JSON.stringify(args, null, 2)}`);
    });
  });
}

export default enableEventDebugging;
