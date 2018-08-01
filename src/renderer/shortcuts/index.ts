import { actions } from "common/actions";
import { Store } from "common/types";

import Combokeys from "combokeys-ftl";
import hookGlobalBind from "combokeys-ftl/plugins/global-bind";
import { ambientWind } from "common/util/navigation";

const combo = new Combokeys(document.documentElement);
hookGlobalBind(combo);

const macos = process.platform === "darwin";

function setupShortcuts(store: Store) {
  // dev shortcuts
  combo.bindGlobal(["shift+f12", "ctrl+shift+c", "command+shift+c"], () => {
    store.dispatch(actions.openDevTools({ forApp: true, wind: ambientWind() }));
  });
  combo.bindGlobal(["shift+f5", "shift+command+r"], () =>
    window.location.reload()
  );

  // user shortcuts
  combo.bindGlobal(["ctrl+shift+f", "command+shift+f"], () => {
    store.dispatch(actions.focusSearch({}));
  });

  combo.bindGlobal(["ctrl+f", "command+f"], () => {
    store.dispatch(actions.focusInPageSearch({ wind: ambientWind() }));
  });

  combo.bindGlobal(["f5", "ctrl+r", "command+r"], () => {
    store.dispatch(actions.commandReload({ wind: ambientWind() }));
  });

  combo.bindGlobal(["enter"], () => {
    store.dispatch(actions.commandOk({ wind: ambientWind() }));
  });

  combo.bindGlobal(["ctrl+enter", "command+enter"], () => {
    store.dispatch(actions.commandMain({ wind: ambientWind() }));
  });

  combo.bindGlobal(["ctrl+l", "command+l"], () => {
    store.dispatch(actions.commandLocation({ wind: ambientWind() }));
  });

  combo.bindGlobal(["escape"], () => {
    store.dispatch(actions.commandBack({ wind: ambientWind() }));
  });

  combo.bindGlobal(["alt+left"], () => {
    store.dispatch(actions.commandGoBack({ wind: ambientWind() }));
  });

  combo.bindGlobal(["alt+right"], () => {
    store.dispatch(actions.commandGoForward({ wind: ambientWind() }));
  });

  const prefix = macos ? "command" : "ctrl";

  for (const i of [1, 2, 3, 4, 5, 6, 7, 8, 9]) {
    combo.bindGlobal([`${prefix}+${i}`], () => {
      store.dispatch(actions.focusNthTab({ wind: ambientWind(), index: i }));
    });
  }
}

export default setupShortcuts;
