import { actions } from "../actions";

import * as Combokeys from "combokeys-ftl";
import * as hookGlobalBind from "combokeys-ftl/plugins/global-bind";

import { IStore } from "../types";

const combo = new Combokeys(document.documentElement);
hookGlobalBind(combo);

const macos = process.platform === "darwin";

export default function setupShortcuts(store: IStore) {
  // dev shortcuts
  combo.bindGlobal(["shift+f12", "ctrl+shift+c", "command+shift+c"], () => {
    store.dispatch(actions.openDevTools({ forApp: true }));
  });
  combo.bindGlobal(["shift+f5", "shift+command+r"], () =>
    window.location.reload()
  );

  // user shortcuts
  combo.bindGlobal(["ctrl+f", "command+f"], () => {
    store.dispatch(actions.focusSearch({}));
  });

  combo.bindGlobal(["ctrl+tab", "ctrl+pagedown"], () => {
    store.dispatch(actions.showNextTab({}));
  });

  combo.bindGlobal(["ctrl+shift+tab", "ctrl+pageup"], () => {
    store.dispatch(actions.showPreviousTab({}));
  });

  combo.bindGlobal(["f5", "ctrl+r", "command+r"], () => {
    store.dispatch(actions.trigger({ command: "reload" }));
  });

  combo.bindGlobal(["enter"], () => {
    store.dispatch(actions.trigger({ command: "ok" }));
  });

  combo.bindGlobal(["ctrl+enter", "command+enter"], () => {
    store.dispatch(actions.trigger({ command: "main" }));
  });

  combo.bindGlobal(["ctrl+l", "command+l"], () => {
    store.dispatch(actions.trigger({ command: "location" }));
  });

  combo.bindGlobal(["escape"], () => {
    store.dispatch(actions.trigger({ command: "back" }));
  });

  const prefix = macos ? "command" : "ctrl";

  for (const i of [1, 2, 3, 4, 5, 6, 7, 8, 9]) {
    combo.bindGlobal([`${prefix}+${i}`], () => {
      store.dispatch(actions.focusNthTab({ index: i }));
    });
  }
}
