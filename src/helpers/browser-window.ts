import * as electron from "electron";

const fakeWindow = {
  setMenu(menu: Electron.Menu) {},
} as Electron.BrowserWindow;

export const BrowserWindow = {
  fromId(id: number): electron.BrowserWindow {
    if (process.env.NODE_ENV === "test") {
      return fakeWindow;
    }
    return electron.BrowserWindow.fromId(id);
  },
};
