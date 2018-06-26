import { Watcher } from "common/util/watcher";
import { Store } from "common/types";

import { actions } from "common/actions";

import rootLogger from "common/logger";
import { messages, withLogger } from "common/butlerd/index";
import { indexBy, isEmpty } from "underscore";
import { appdataLocationPath } from "common/util/paths";
import { Manager } from "../broth/manager";
import { delay } from "./delay";
import { makeButlerInstance } from "common/butlerd/master-client";
import { Client } from "butlerd";
import { ItchPromise } from "common/util/itch-promise";
const logger = rootLogger.child({ name: "setup" });
const call = withLogger(logger);

async function syncInstallLocations(store: Store) {
  const { installLocations } = await call(messages.InstallLocationsList, {});
  const newLocationsById = indexBy(installLocations, "id");

  const rs = store.getState();
  let oldLocations = {
    ...rs.preferences.installLocations,
    appdata: {
      id: "appdata",
      path: appdataLocationPath(),
    },
  } as { [key: string]: { id: string; path: string } };

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

let masterClient: Client;
let initialButlerdResolve: (value?: any) => void;
let initialButlerdPromise = new ItchPromise((resolve, reject) => {
  initialButlerdResolve = resolve;
});

async function initialSetup(store: Store, { retry }: { retry: boolean }) {
  try {
    store.dispatch(
      actions.setupStatus({
        icon: "install",
        message: ["login.status.finalizing_installation"],
      })
    );

    if (!manager) {
      manager = new Manager(store);
    }
    await manager.ensure();

    await Promise.race([
      initialButlerdPromise,
      new ItchPromise((resolve, reject) => {
        setTimeout(() => {
          reject(new Error("Timed out while connecting to butlerd"));
        }, 5000);
      }),
    ]);
    await syncInstallLocations(store);
    store.dispatch(actions.setupDone({}));
    logger.info(`Setup done`);
  } catch (e) {
    logger.error(`setup got error: ${e.stack}`);

    if (retry) {
      // UX trick #239408: sometimes setup is so fast,
      // it does't feel like anything happened,
      // so let the user see that we tried.
      await delay(1000);
    }

    store.dispatch(
      actions.setupStatus({
        icon: "error",
        message: ["login.status.setup_failure", { error: e.message || "" + e }],
        stack: e.stack,
      })
    );
  }
}

async function refreshButlerd(store: Store) {
  logger.info(`Refreshing butlerd! Spinning up new instance...`);
  let instance = await makeButlerInstance();
  instance.promise().catch(e => {
    console.error(`butlerd instance threw:`);
    console.error(e.stack);
    refreshButlerd(store).catch(() => {});
  });
  const endpoint = await instance.getEndpoint();

  logger.info(`Connecting client...`);
  const nextClient = new Client(endpoint);
  await nextClient.connect();

  if (masterClient) {
    // instances exit gracefully when all clients have closed
    logger.info(`Closing old master client...`);
    masterClient.close();
    masterClient = null;
  }
  masterClient = nextClient;
  logger.info(`Got new endpoint`);
  store.dispatch(actions.gotButlerdEndpoint({ endpoint }));
  initialButlerdResolve();
}

export default function(watcher: Watcher) {
  watcher.on(actions.boot, async (store, action) => {
    await initialSetup(store, { retry: false });
  });

  watcher.on(actions.retrySetup, async (store, action) => {
    await initialSetup(store, { retry: true });
  });

  watcher.on(actions.packageGotVersionPrefix, async (store, action) => {
    const { name } = action.payload;
    if (name === "butler") {
      await refreshButlerd(store);
    }
  });
}
