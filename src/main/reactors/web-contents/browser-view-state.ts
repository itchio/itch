import { BrowserView } from "electron";

const browserViews: {
  [wind: string]: {
    [tab: string]: BrowserView;
  };
} = {};

export function storeBrowserView(wind: string, tab: string, bv: BrowserView) {
  if (!(wind in browserViews)) {
    browserViews[wind] = {};
  }
  browserViews[wind][tab] = bv;
}

export function getBrowserView(wind: string, tab: string): BrowserView | null {
  if (!(wind in browserViews)) {
    return null;
  }
  return browserViews[wind][tab];
}

export function forgetBrowserView(wind: string, tab: string) {
  if (!(wind in browserViews)) {
    return;
  }
  delete browserViews[wind][tab];
}
