
import * as invariant from "invariant";
import * as ospath from "path";
import * as uuid from "node-uuid";

import {omit, each} from "underscore";

import {createSelector} from "reselect";

import diskspace from "../util/diskspace";
import explorer from "../util/explorer";
import localizer from "../localizer";

import * as actions from "../actions";

import {BrowserWindow, dialog} from "../electron";

import {IStore, IState} from "../types";
import {
  IAction,
  IRemoveInstallLocationRequestPayload,
  IRemoveInstallLocationPayload,
  IAddInstallLocationRequestPayload,
  IAddInstallLocationPayload,
  IWindowFocusChangedPayload,
  ITaskEndedPayload,
  IQueryFreeSpacePayload,
  IBrowseInstallLocationPayload,
  IMakeInstallLocationDefaultPayload,
} from "../constants/action-types";

async function removeInstallLocationRequest (store: IStore, action: IAction<IRemoveInstallLocationRequestPayload>) {
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
}

async function addInstallLocationRequest (store: IStore, action: IAction<IAddInstallLocationRequestPayload>) {
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
}

async function removeInstallLocation (store: IStore, action: IAction<IRemoveInstallLocationPayload>) {
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
}

async function addInstallLocation (store: IStore, action: IAction<IAddInstallLocationPayload>) {
  const loc = action.payload;
  const installLocations = store.getState().preferences.installLocations;

  store.dispatch(actions.updatePreferences({
    installLocations: Object.assign({}, installLocations, {
      [loc.name]: omit(loc, "name"),
    }),
  }));
}

async function windowFocusChanged (store: IStore, action: IAction<IWindowFocusChangedPayload>) {
  const {focused} = action.payload;
  if (focused) {
    store.dispatch(actions.queryFreeSpace({}));
  }
}

// FIXME: uh that seems fishy
async function taskEnded (store: IStore, action: IAction<ITaskEndedPayload>) {
  const id = store.getState().session.navigation.id;
  if (id === "preferences") {
    store.dispatch(actions.queryFreeSpace({}));
  }
}

async function queryFreeSpace (store: IStore, action: IAction<IQueryFreeSpacePayload>) {
  const diskInfo = await diskspace.diskInfo();
  store.dispatch(actions.freeSpaceUpdated({diskInfo}));
}

async function browseInstallLocation (store: IStore, action: IAction<IBrowseInstallLocationPayload>) {
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
}

async function makeInstallLocationDefault (store: IStore, action: IAction<IMakeInstallLocationDefaultPayload>) {
  const {name} = action.payload;
  invariant(typeof name === "string", "default install location name must be a string");

  store.dispatch(actions.updatePreferences({
    defaultInstallLocation: name,
  }));
}

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

async function catchAll (store: IStore, action: IAction<any>) {
  if (!selector) {
    selector = makeSelector(store);
  }
  selector(store.getState());
}

export default {makeInstallLocationDefault,
  removeInstallLocationRequest, removeInstallLocation,
  addInstallLocationRequest, addInstallLocation,
  browseInstallLocation, queryFreeSpace,
  windowFocusChanged, taskEnded, catchAll,
};
