import * as electron from "electron";

export const Menu = {
  buildFromTemplate(
    template: Electron.MenuItemConstructorOptions[]
  ): Electron.Menu {
    if (!process.type) {
      return null;
    }
    return electron.Menu.buildFromTemplate(template);
  },

  setApplicationMenu(menu: Electron.Menu) {
    if (!process.type) {
      return;
    }
    electron.Menu.setApplicationMenu(menu);
  },
};
