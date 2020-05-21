import { OnQuery } from "main/socket-handler";
import { MainState } from "main";
import { ExtendedWebContents } from "common/extended-web-contents";
import { webContents, shell } from "electron";
import { queries } from "common/queries";

function getWc(wcId: number): ExtendedWebContents {
  return webContents.fromId(wcId) as ExtendedWebContents;
}

export function registerQueriesWebview(ms: MainState, onQuery: OnQuery) {
  onQuery(queries.restoreWebviewState, async ({ wcId }) => {
    const { history, currentIndex } = ms.webview;
    const wc = getWc(wcId);
    wc.history = history;
    wc.goToIndex(currentIndex);
  });

  onQuery(queries.saveWebviewState, async ({ wcId }) => {
    const wc = getWc(wcId);
    const { history, currentIndex } = wc;
    // quick & dirty deep clone
    let state = { history, currentIndex };
    state = JSON.parse(JSON.stringify(state));
    ms.webview = state;
  });

  onQuery(queries.getWebviewState, async ({ wcId }) => {
    const wc = getWc(wcId);
    const { history, currentIndex } = wc;
    const state = { history, currentIndex };
    // no need to deep clone here, gets serialized/deserialized
    // anyway.
    return { state };
  });

  onQuery(queries.openWebviewDevTools, async ({ wcId }) => {
    const wc = getWc(wcId);
    wc.openDevTools({ mode: "detach" });
    wc.devToolsWebContents?.focus();
  });

  onQuery(queries.webviewGoBack, async ({ wcId }) => {
    const wc = getWc(wcId);
    const state = ms.webview;
    if (state.currentIndex > 0) {
      wc.goToIndex(state.currentIndex - 1);
    }
  });

  onQuery(queries.webviewGoForward, async ({ wcId }) => {
    const wc = getWc(wcId);
    const state = ms.webview;
    if (state.currentIndex < state.history.length - 1) {
      wc.goToIndex(state.currentIndex + 1);
    }
  });

  onQuery(queries.webviewStop, async ({ wcId }) => {
    const wc = getWc(wcId);
    wc.stop();
  });

  onQuery(queries.webviewReload, async ({ wcId }) => {
    const wc = getWc(wcId);
    wc.reload();
  });

  onQuery(queries.webviewPopout, async ({ wcId }) => {
    const wc = getWc(wcId);
    let url = wc.getURL();
    if (!/itch:/.test(url)) {
      shell.openExternal(url);
    }
  });
}
