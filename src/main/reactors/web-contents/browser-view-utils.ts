import { Store, WebviewScreenshot } from "common/types";
import { BrowserView } from "electron";
import {
  browserViewToTab,
  forgetBrowserView,
  getBrowserView,
} from "main/reactors/web-contents/browser-view-state";
import { getNativeWindow } from "main/reactors/winds";
import { isEmpty } from "underscore";

export function hideBrowserView(store: Store, wind: string) {
  const rs = store.getState();
  const nw = getNativeWindow(rs, wind);

  const bv = nw.getBrowserView();
  if (bv) {
    const tab = browserViewToTab(bv);
    if (tab) {
      setTimeout(() => {
        try {
          nw.setBrowserView(null);
        } catch (e) {
          console.error(`While clearing browser view: ${e.stack}`);
        }
      }, 100);
      bv.webContents.capturePage(img => {
        sendScreenshot(
          store,
          wind,
          tab,
          img.toBitmap(),
          img.getSize().width,
          img.getSize().height
        );
      });
    } else {
      nw.setBrowserView(null);
    }
  }
}

export function getBrowserViewToShow(store: Store, wind: string): BrowserView {
  const rs = store.getState();

  if (!rs.profile.profile) {
    // don't show browser views if logged out
    console.log(`logged out, not showing`);
    return null;
  }

  const ws = rs.winds[wind];
  if (!isEmpty(ws.modals)) {
    // don't show browser view again as long as there are modals
    console.log(`has modals, not showing`);
    return null;
  }
  if (rs.ui.search.open) {
    // don't show browser view again as long as search is open
    console.log(`search open, not showing`);
    return null;
  }

  const { tab } = ws.navigation;
  return getBrowserView(wind, tab); // bv can be null here, that's ok
}

export function showBrowserView(store: Store, wind: string) {
  const rs = store.getState();
  const nw = getNativeWindow(rs, wind);
  const bv = getBrowserViewToShow(store, wind);
  const obv = nw.getBrowserView();
  let focusAfterSwitch = false;
  if (bv && obv != bv) {
    focusAfterSwitch = true;
  }
  nw.setBrowserView(bv);
  if (focusAfterSwitch) {
    bv.webContents.focus();
  }
}

export function destroyBrowserView(store: Store, wind: string, tab: string) {
  const rs = store.getState();
  const bv = getBrowserView(wind, tab);
  if (bv) {
    // avoid crashing, see
    // https://github.com/electron/electron/issues/10096
    const nw = getNativeWindow(rs, wind);
    if (nw.getBrowserView() == bv) {
      nw.setBrowserView(null);
    }
    bv.destroy();
    forgetBrowserView(wind, tab);
  }
}

export function setBrowserViewFullscreen(store: Store, wind: string) {
  const rs = store.getState();
  const nw = getNativeWindow(rs, wind);
  const bv = nw.getBrowserView();

  const bounds = nw.getContentBounds();
  bv.setBounds({
    width: bounds.width,
    height: bounds.height,
    x: 0,
    y: 0,
  });
}

export function sendScreenshot(
  store: Store,
  wind: string,
  tab: string,
  buf: Buffer,
  width: number,
  height: number
) {
  const rs = store.getState();
  const rw = getNativeWindow(rs, wind);
  const payload: WebviewScreenshot = {
    tab,
    bitmap: buf,
    size: { width, height },
  };
  rw.webContents.send(`made-webview-screenshot`, payload);
}
