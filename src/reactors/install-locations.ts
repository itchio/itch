import { Watcher } from "./watcher";

import * as invariant from "invariant";
import * as ospath from "path";
import uuid from "../util/uuid";

import { omit } from "underscore";

import { createSelector } from "reselect";

import diskspace from "../os/diskspace";
import explorer from "../os/explorer";
import { t } from "../format";

import * as actions from "../actions";

import { BrowserWindow, dialog } from "electron";

import { IStore, IAppState } from "../types";
import { IAddInstallLocationPayload } from "../constants/action-types";

import Context from "../context";
import { DB } from "../db";

let selector: (state: IAppState) => void;
const makeSelector = (store: IStore) =>
  createSelector(
    (state: IAppState) => state.preferences.installLocations,
    (state: IAppState) => state.session.navigation.id,
    (installLocs, id) => {
      setImmediate(() => {
        if (id === "preferences") {
          store.dispatch(actions.queryFreeSpace({}));
        }
      });
    },
  );

export default function(watcher: Watcher, db: DB) {
  watcher.on(actions.makeInstallLocationDefault, async (store, action) => {
    const { name } = action.payload;
    invariant(
      typeof name === "string",
      "default install location name must be a string",
    );

    store.dispatch(
      actions.updatePreferences({
        defaultInstallLocation: name,
      }),
    );
  });

  watcher.on(actions.removeInstallLocationRequest, async (store, action) => {
    const { name } = action.payload;
    invariant(
      typeof name === "string",
      "removed install location name must be a string",
    );
    invariant(name !== "appdata", "cannot remove appdata");

    const numItems = db.caves.count(k => k.where({ installLocation: name }));

    const i18n = store.getState().i18n;

    // TODO: use a modal instead
    if (numItems > 0) {
      const buttons = [
        t(i18n, ["prompt.install_location_not_empty.show_contents"]),
        t(i18n, ["prompt.action.ok"]),
      ];

      const dialogOpts = {
        title: t(i18n, ["prompt.install_location_not_empty.title"]),
        message: t(i18n, ["prompt.install_location_not_empty.message"]),
        detail: t(i18n, ["prompt.install_location_not_empty.detail"]),
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
        t(i18n, ["prompt.action.confirm_removal"]),
        t(i18n, ["prompt.action.cancel"]),
      ];

      const dialogOpts = {
        title: t(i18n, ["prompt.install_location_remove.title"]),
        message: t(i18n, ["prompt.install_location_remove.message"]),
        detail: t(i18n, [
          "prompt.install_location_remove.detail",
          {
            location: loc.path,
          },
        ]),
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
        store.dispatch(actions.removeInstallLocation({ name }));
      }
    }
  });

  watcher.on(actions.removeInstallLocation, async (store, action) => {
    const { name } = action.payload;
    invariant(
      typeof name === "string",
      "removed install location name must be a string",
    );
    invariant(name !== "appdata", "cannot remove appdata");
    const installLocations = store.getState().preferences.installLocations;
    let defaultInstallLocation = store.getState().preferences
      .defaultInstallLocation;

    if (defaultInstallLocation === name) {
      defaultInstallLocation = "appdata";
    }

    store.dispatch(
      actions.updatePreferences({
        defaultInstallLocation,
        installLocations: {
          ...installLocations,
          [name]: {
            ...installLocations[name],
            deleted: true,
          },
        },
      }),
    );
  });

  watcher.on(actions.addInstallLocationRequest, async (store, action) => {
    const i18n = store.getState().i18n;
    const windowId = store.getState().ui.mainWindow.id;
    const window = BrowserWindow.fromId(windowId);

    if (!window) {
      return;
    }

    const dialogOpts = {
      title: t(i18n, ["prompt.install_location_add.title"]),
      // crazy typescript workaround, avert your eyes
      properties: ["openDirectory", "createDirectory"] as (
        | "openDirectory"
        | "createDirectory")[],
    };

    const promise = new Promise<
      IAddInstallLocationPayload
    >((resolve, reject) => {
      const callback = (response: string[]) => {
        if (!response) {
          return resolve();
        }

        return resolve({
          name: uuid(),
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

    store.dispatch(
      actions.updatePreferences({
        installLocations: {
          ...installLocations,
          [loc.name]: omit(loc, "name"),
        },
      }),
    );
  });

  watcher.on(actions.browseInstallLocation, async (store, action) => {
    const { name } = action.payload;
    invariant(
      typeof name === "string",
      "browsed install location name is a string",
    );

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
    const ctx = new Context(store, db);
    const diskInfo = await diskspace.diskInfo(ctx);
    store.dispatch(actions.freeSpaceUpdated({ diskInfo }));
  });

  watcher.on(actions.windowFocusChanged, async (store, action) => {
    const { focused } = action.payload;
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
