import electron from "electron";

const fakeWindow = {
  setMenu(menu: Electron.Menu) {},
} as Electron.BrowserWindow;

export const BrowserWindow = {
  fromId(id: number): electron.BrowserWindow | null {
    if (!process.type) {
      return fakeWindow;
    }
    return electron.BrowserWindow.fromId(id);
  },
};
