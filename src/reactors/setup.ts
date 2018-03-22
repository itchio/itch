import { Watcher } from "./watcher";
import { IStore } from "../types";

import { actions } from "../actions";

import rootLogger from "../logger";
import { messages, withLogger } from "../buse/index";
import { indexBy, isEmpty } from "underscore";
import { appdataLocationPath } from "../os/paths";
import { Manager } from "../broth/manager";
const logger = rootLogger.child({ name: "setup" });
const call = withLogger(logger);

async function syncInstallLocations(store: IStore) {
  const { installLocations } = await call(messages.InstallLocationsList, {});
  const newLocationsById = indexBy(installLocations, "id");

  const rs = store.getState();
  let oldLocations = {
    ...rs.preferences.installLocations,
    appdata: {
      id: "appdata",
      path: appdataLocationPath(),
    },
  };

  let numAdded = 0;
  if (!isEmpty(oldLocations)) {
    for (const id of Object.keys(oldLocations)) {
      logger.debug(`Checking install location ${id}...`);
      const oldLoc = oldLocations[id];
      const newLoc = newLocationsById[id];
      if (newLoc) {
        logger.debug(`Has on butler side too!`);
      } else {
        logger.debug(`Synchronizing ${id}...`);
        numAdded++;
        await call(messages.InstallLocationsAdd, {
          id,
          path: oldLoc.path,
        });
      }
    }
  }

  if (numAdded > 0) {
    logger.info(`Registered ${numAdded} install locations with butler`);
  } else {
    logger.info(`All install locations synchronized with butler`);
  }
}

export let manager: Manager;

async function initialSetup(store: IStore) {
  try {
    manager = new Manager(store);
    await manager.ensure();

    await syncInstallLocations(store);
    store.dispatch(actions.setupDone({}));
  } catch (e) {
    logger.error(`setup got error: ${e.stack}`);

    store.dispatch(
      actions.setupStatus({
        icon: "error",
        message: ["login.status.setup_failure", { error: e.message || "" + e }],
        stack: e.stack,
      })
    );
  }
}

export default function(watcher: Watcher) {
  watcher.on(actions.boot, async (store, action) => {
    await initialSetup(store);
  });

  watcher.on(actions.retrySetup, async (store, action) => {
    await initialSetup(store);
  });
}
