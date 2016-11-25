
import {Watcher} from "./watcher";

import * as invariant from "invariant";
import * as ospath from "path";
import * as uuid from "uuid";

import {omit, each} from "underscore";

import {createSelector} from "reselect";

import diskspace from "../util/diskspace";
import explorer from "../util/explorer";
import localizer from "../localizer";

import * as actions from "../actions";

import {BrowserWindow, dialog} from "../electron";

import {IStore, IState} from "../types";
import {IAddInstallLocationPayload} from "../constants/action-types";

let selector: (state: IState) => void;
const makeSelector = (store: IStore) => createSelector(
  (state: IState) => state.preferences.installLocations,
  (state: IState) => state.session.navigation.id,
  (installLocs, id) => {
    setImmediate(() => {
      if (id === "preferences") {
        store.dispatch(actions.queryFreeSpace({}));
      }
    });
  }
);

export default function (watcher: Watcher) {
  watcher.on(actions.makeInstallLocationDefault, async (store, action) => {
    const {name} = action.payload;
    invariant(typeof name === "string", "default install location name must be a string");

    store.dispatch(actions.updatePreferences({
      defaultInstallLocation: name,
    }));
  });

  watcher.on(actions.removeInstallLocationRequest, async (store, action) => {
    const {name} = action.payload;
    invariant(typeof name === "string", "removed install location name must be a string");
    invariant(name !== "appdata", "cannot remove appdata");

    const caves = store.getState().globalMarket.caves;
    let numItems = 0;
    each(caves, (cave) => {
      if (cave.installLocation === name) {
        numItems++;
      }
    });

    const i18n = store.getState().i18n;
    const t = localizer.getT(i18n.strings, i18n.lang);

    if (numItems > 0) {
      const buttons = [
        t("prompt.install_location_not_empty.show_contents"),
        t("prompt.action.ok"),
      ];

      const dialogOpts = {
        title: t("prompt.install_location_not_empty.title"),
        message: t("prompt.install_location_not_empty.message"),
        detail: t("prompt.install_location_not_empty.detail"),
        buttons,
      };

      const promise = new Promise((resolve, reject) => {
        const callback = (response: number) => {
          resolve(response);
        };
        dialog.showMessageBox(dialogOpts, callback);
      });

      const response = await promise;
      if (response === 0) {
        store.dispatch(actions.navigate(`locations/${name}`));
      }
      return;
    }

    {
      const loc = store.getState().preferences.installLocations[name];

      const buttons = [
        t("prompt.action.confirm_removal"),
        t("prompt.action.cancel"),
      ];

      const dialogOpts = {
        title: t("prompt.install_location_remove.title"),
        message: t("prompt.install_location_remove.message"),
        detail: t("prompt.install_location_remove.detail", {location: loc.path}),
        buttons,
      };

      const promise = new Promise((resolve, reject) => {
        const callback = (response: number) => {
          resolve(response);
        };
        dialog.showMessageBox(dialogOpts, callback);
      });

      const response = await promise;
      if (response === 0) {
        store.dispatch(actions.removeInstallLocation({name}));
      }
    }
  });

  watcher.on(actions.removeInstallLocation, async (store, action) => {
    const {name} = action.payload;
    invariant(typeof name === "string", "removed install location name must be a string");
    invariant(name !== "appdata", "cannot remove appdata");
    const installLocations = store.getState().preferences.installLocations;
    let defaultInstallLocation = store.getState().preferences.defaultInstallLocation;

    if (defaultInstallLocation === name) {
      defaultInstallLocation = "appdata";
    }

    store.dispatch(actions.updatePreferences({
      defaultInstallLocation,
      installLocations: Object.assign({}, installLocations, {
        [name]: Object.assign({}, installLocations[name], {
          deleted: true,
        }),
      }),
    }));
  });

  watcher.on(actions.addInstallLocationRequest, async (store, action) => {
    const i18n = store.getState().i18n;
    const t = localizer.getT(i18n.strings, i18n.lang);
    const windowId = store.getState().ui.mainWindow.id;
    const window = BrowserWindow.fromId(windowId);

    if (!window) {
      return;
    }

    const dialogOpts = {
      title: t("prompt.install_location_add.title"),
      properties: ["openDirectory"],
    };

    const promise = new Promise<IAddInstallLocationPayload>((resolve, reject) => {
      const callback = (response: string[]) => {
        if (!response) {
          return resolve();
        }

        return resolve({
          name: uuid.v4(),
          path: response[0],
        });
      };
      dialog.showOpenDialog(window, dialogOpts, callback);
    });

    const loc = await promise;
    if (loc) {
      store.dispatch(actions.addInstallLocation(loc));
    }
  });

  watcher.on(actions.addInstallLocation, async (store, action) => {
    const loc = action.payload;
    const installLocations = store.getState().preferences.installLocations;

    store.dispatch(actions.updatePreferences({
      installLocations: Object.assign({}, installLocations, {
        [loc.name]: omit(loc, "name"),
      }),
    }));
  });

  watcher.on(actions.browseInstallLocation, async (store, action) => {
    const {name} = action.payload;
    invariant(typeof name === "string", "browsed install location name is a string");

    if (name === "appdata") {
      const userData = store.getState().system.userDataPath;
      return explorer.open(ospath.join(userData, "apps"));
    } else {
      const loc = store.getState().preferences.installLocations[name];
      if (!loc) {
        return;
      }
      return explorer.open(loc.path);
    }
  });

  watcher.on(actions.queryFreeSpace, async (store, action) => {
    const diskInfo = await diskspace.diskInfo();
    store.dispatch(actions.freeSpaceUpdated({diskInfo}));
  });

  watcher.on(actions.windowFocusChanged, async (store, action) => {
    const {focused} = action.payload;
    if (focused) {
      store.dispatch(actions.queryFreeSpace({}));
    }
  });

  watcher.on(actions.taskEnded, async (store, action) => {
    const id = store.getState().session.navigation.id;
    if (id === "preferences") {
      store.dispatch(actions.queryFreeSpace({}));
    }
  });

  watcher.onAll(async (store, action) => {
    if (!selector) {
      selector = makeSelector(store);
    }
    selector(store.getState());
  });
}
