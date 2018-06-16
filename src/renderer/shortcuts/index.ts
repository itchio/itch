import { actions } from "common/actions";
import { Store } from "common/types";

import Combokeys from "combokeys-ftl";
import hookGlobalBind from "combokeys-ftl/plugins/global-bind";
import { rendererWindow } from "common/util/navigation";

const combo = new Combokeys(document.documentElement);
hookGlobalBind(combo);

const macos = process.platform === "darwin";

function setupShortcuts(store: Store) {
  // dev shortcuts
  combo.bindGlobal(["shift+f12", "ctrl+shift+c", "command+shift+c"], () => {
    store.dispatch(
      actions.openDevTools({ forApp: true, window: rendererWindow() })
    );
  });
  combo.bindGlobal(["shift+f5", "shift+command+r"], () =>
    window.location.reload()
  );

  // user shortcuts
  combo.bindGlobal(["ctrl+f", "command+f"], () => {
    store.dispatch(actions.focusInPageSearch({ window: rendererWindow() }));
  });

  combo.bindGlobal(["ctrl+tab", "ctrl+pagedown"], () => {
    store.dispatch(actions.showNextTab({ window: rendererWindow() }));
  });

  combo.bindGlobal(["ctrl+shift+tab", "ctrl+pageup"], () => {
    store.dispatch(actions.showPreviousTab({ window: rendererWindow() }));
  });

  combo.bindGlobal(["f5", "ctrl+r", "command+r"], () => {
    store.dispatch(actions.commandReload({ window: rendererWindow() }));
  });

  combo.bindGlobal(["enter"], () => {
    store.dispatch(actions.commandOk({ window: rendererWindow() }));
  });

  combo.bindGlobal(["ctrl+enter", "command+enter"], () => {
    store.dispatch(actions.commandMain({ window: rendererWindow() }));
  });

  combo.bindGlobal(["ctrl+l", "command+l"], () => {
    store.dispatch(actions.commandLocation({ window: rendererWindow() }));
  });

  combo.bindGlobal(["escape"], () => {
    store.dispatch(actions.commandBack({ window: rendererWindow() }));
  });

  combo.bindGlobal(["alt+left"], () => {
    store.dispatch(actions.commandGoBack({ window: rendererWindow() }));
  });

  combo.bindGlobal(["alt+right"], () => {
    store.dispatch(actions.commandGoForward({ window: rendererWindow() }));
  });

  const prefix = macos ? "command" : "ctrl";

  for (const i of [1, 2, 3, 4, 5, 6, 7, 8, 9]) {
    combo.bindGlobal([`${prefix}+${i}`], () => {
      store.dispatch(
        actions.focusNthTab({ window: rendererWindow(), index: i })
      );
    });
  }
}

export default setupShortcuts;
