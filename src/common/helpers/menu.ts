import electron from "electron";

export const Menu = {
  buildFromTemplate(
    template: Electron.MenuItemConstructorOptions[]
  ): Electron.Menu {
    if (!process.type) {
      return null;
    }
    validateMenuTemplate(template, "root");
    return electron.Menu.buildFromTemplate(template);
  },

  setApplicationMenu(menu: Electron.Menu) {
    if (!process.type) {
      return;
    }
    electron.Menu.setApplicationMenu(menu);
  },
};

function validateMenuTemplate(template: any[], path: string) {
  for (const item of template) {
    if (!item.label && !item.role && !item.type) {
      console.warn(
        `in path ${path}, menu template item has none of (label, role, type): ${JSON.stringify(
          item,
          null,
          2
        )}`
      );
    }
    if (item.submenu) {
      validateMenuTemplate(item.submenu, `${path}/${item.label || item.role}`);
    }
  }
}
