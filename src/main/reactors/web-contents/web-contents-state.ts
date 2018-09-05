import { WebContents } from "electron";

const webContents: {
  [wind: string]: {
    [tab: string]: WebContents;
  };
} = {};

export function storeWebContents(wind: string, tab: string, wc: WebContents) {
  if (!(wind in webContents)) {
    webContents[wind] = {};
  }
  webContents[wind][tab] = wc;
}

export function getWebContents(wind: string, tab: string): WebContents | null {
  if (!(wind in webContents)) {
    return null;
  }
  return webContents[wind][tab];
}

export function forgetWebContents(wind: string, tab: string) {
  if (!(wind in webContents)) {
    return;
  }
  delete webContents[wind][tab];
}

export function webContentsToTab(wc: WebContents): string {
  for (const wind of Object.keys(webContents)) {
    const tabs = webContents[wind];
    for (const tab of Object.keys(tabs)) {
      const tbv = webContents[wind][tab];
      if (tbv === wc) {
        return tab;
      }
    }
  }
  return null;
}
