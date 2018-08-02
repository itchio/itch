import { Store } from "common/types";
import { getNativeWindow } from "main/reactors/winds";
import { BrowserView } from "electron";
import { isEmpty } from "underscore";
import {
  getBrowserView,
  forgetBrowserView,
} from "main/reactors/web-contents/browser-view-state";

export function hideBrowserView(store: Store, wind: string) {
  const rs = store.getState();
  const nw = getNativeWindow(rs, wind);
  nw.setBrowserView(null);
}

export function getBrowserViewToShow(store: Store, wind: string): BrowserView {
  const rs = store.getState();
  const nw = getNativeWindow(rs, wind);

  if (!rs.profile.profile) {
    // don't show browser views if logged out
    return null;
  }

  const ws = rs.winds[wind];
  if (!isEmpty(ws.modals)) {
    // don't show browser view again as long as there are modals
    return null;
  }
  if (ws.contextMenu && ws.contextMenu.open) {
    // don't show browser view again as long as there are context menus
    return null;
  }

  const { tab } = ws.navigation;
  return getBrowserView(wind, tab); // bv can be null here, that's ok
}

export function showBrowserView(store: Store, wind: string) {
  const rs = store.getState();
  const nw = getNativeWindow(rs, wind);
  nw.setBrowserView(getBrowserViewToShow(store, wind));
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
