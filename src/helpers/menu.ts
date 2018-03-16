import * as electron from "electron";

export const Menu = {
  buildFromTemplate(
    template: Electron.MenuItemConstructorOptions[]
  ): Electron.Menu {
    if (process.env.NODE_ENV === "test") {
      return null;
    }
    return electron.Menu.buildFromTemplate(template);
  },

  setApplicationMenu(menu: Electron.Menu) {
    if (process.env.NODE_ENV === "test") {
      return;
    }
    electron.Menu.setApplicationMenu(menu);
  },
};
