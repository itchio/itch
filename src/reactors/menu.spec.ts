import suite, { TestWatcher, immediate } from "../test-suite";
import * as actions from "../actions";
import { IRuntime } from "../types";

import "electron";
import menu, { fleshOutTemplate } from "./menu";
import { findWhere } from "underscore";

suite(__filename, s => {
  s.case("builds the menu", async t => {
    let w = new TestWatcher();
    const winRuntime: IRuntime = {
      platform: "windows",
      is64: false,
    };
    menu(w, winRuntime);

    // fire a dummy action so the menu updates
    await w.dispatch(
      actions.localeDownloadEnded({
        lang: "en",
        resources: {
          "menu.help.help": "Help",
        },
      }),
    );
    await immediate();

    let template = w.store.getState().ui.menu.template;
    let account = findWhere(template, { label: "menu.account.account" });
    t.same(account.submenu[0].label, "menu.account.not_logged_in");

    await w.dispatch(
      actions.loginSucceeded({
        key: "hello",
        me: {} as any,
      }),
    );
    await immediate();

    template = w.store.getState().ui.menu.template;
    account = findWhere(template, { label: "menu.account.account" });
    t.same(account.submenu[0].label, "menu.account.change_user");

    let changeUserDispatched = false;
    w.on(actions.changeUser, async () => {
      changeUserDispatched = true;
    });

    let fleshed = fleshOutTemplate(template, w.store, winRuntime);
    let accountItem = findWhere(fleshed, {
      label: "menu.account.account",
    });
    accountItem.submenu[0].click();
    t.true(changeUserDispatched);

    let helpItem = findWhere(fleshed, {
      label: "Help",
    });
    t.ok(helpItem, "menu items are translated in english");

    await w.dispatch(
      actions.localeDownloadEnded({
        lang: "fr",
        resources: {
          "menu.help.help": "Aide",
        },
      }),
    );
    await w.dispatch(
      actions.languageChanged({
        lang: "fr-FR",
      }),
    );
    await immediate();

    fleshed = fleshOutTemplate(template, w.store, winRuntime);
    helpItem = findWhere(fleshed, {
      label: "Aide",
    });
    t.ok(helpItem, "menu items are translated in french");

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
    fleshed = fleshOutTemplate(template, w.store, macRuntime);
    visitAll();
  });
});
