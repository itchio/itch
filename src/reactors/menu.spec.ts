import { describe, it, assert, TestWatcher } from "../test";
import { actions } from "../actions";
import { IRuntime, IMenuTemplate } from "../types";

import "electron";
import menu from "./menu";
import { find, findWhere } from "underscore";
import { fleshOutTemplate } from "./context-menu/flesh-out-template";

describe("menu", () => {
  it("builds the menu", async () => {
    let w = new TestWatcher();
    const winRuntime: IRuntime = {
      platform: "windows",
      is64: false,
    };
    menu(w, winRuntime);

    let findMenu = (template: IMenuTemplate, name: string) =>
      find(template, x => x.localizedLabel && x.localizedLabel[0] === name);

    // fire a dummy action so the menu updates
    await w.dispatchAndWaitImmediate(
      actions.localeDownloadEnded({
        lang: "en",
        resources: {
          "menu.help.help": "Help",
        },
      })
    );

    let template = w.store.getState().ui.menu.template;
    let account = findMenu(template, "menu.account.account");
    assert.deepEqual(account.submenu[0].localizedLabel, [
      "menu.account.not_logged_in",
    ]);

    await w.dispatchAndWaitImmediate(
      actions.loginSucceeded({
        profile: {
          id: -1,
          user: {} as any,
          lastConnected: null,
        },
      })
    );

    template = w.store.getState().ui.menu.template;
    account = findMenu(template, "menu.account.account");
    assert.deepEqual(account.submenu[0].localizedLabel, [
      "menu.account.change_user",
    ]);

    let changeUserDispatched = false;
    w.on(actions.changeUser, async () => {
      changeUserDispatched = true;
    });

    let fleshed = fleshOutTemplate(w.store, winRuntime, template);
    const accountItem = findWhere(fleshed, { label: "menu.account.account" });
    accountItem.submenu[0].click();
    assert.isTrue(changeUserDispatched);

    let helpItem = findWhere(fleshed, {
      label: "Help",
    });
    assert.isOk(helpItem, "menu items are translated in english");

    await w.dispatchAndWaitImmediate(
      actions.localeDownloadEnded({
        lang: "fr",
        resources: {
          "menu.help.help": "Aide",
        },
      })
    );
    await w.dispatchAndWaitImmediate(
      actions.languageChanged({
        lang: "fr-FR",
      })
    );

    fleshed = fleshOutTemplate(w.store, winRuntime, template);
    helpItem = findWhere(fleshed, {
      label: "Aide",
    });
    assert.isOk(helpItem, "menu items are translated in french");

    // check that all actions convert properly
    const visit = (item: Electron.MenuItemConstructorOptions) => {
      if (item.submenu) {
        for (const child of item.submenu as Electron.MenuItemConstructorOptions[]) {
          visit(child);
        }
      }

      if (item.click) {
        item.click(null, null, {} as any);
      }
    };

    let visitAll = () => {
      for (const item of fleshed) {
        visit(item);
      }
    };
    visitAll();

    const macRuntime: IRuntime = {
      platform: "osx",
      is64: true,
    };
    fleshed = fleshOutTemplate(w.store, macRuntime, template);
    visitAll();
  });
});
