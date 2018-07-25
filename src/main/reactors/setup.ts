import { Client, Instance } from "butlerd";
import { actions } from "common/actions";
import { messages } from "common/butlerd";
import { makeButlerInstance } from "common/butlerd/make-butler-instance";
import { Store } from "common/types";
import { ItchPromise } from "common/util/itch-promise";
import { appdataLocationPath } from "common/util/paths";
import { Watcher } from "common/util/watcher";
import { indexBy, isEmpty } from "underscore";
import { Manager } from "main/broth/manager";
import { delay } from "main/reactors/delay";
import { mcall } from "main/butlerd/mcall";
import { mainLogger } from "main/logger";
import { app } from "electron";
import env from "common/env";

const logger = mainLogger.child(__filename);

async function syncInstallLocations(store: Store) {
  const { installLocations } = await mcall(messages.InstallLocationsList, {});
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
        await mcall(messages.InstallLocationsAdd, {
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

    const prefs = store.getState().preferences;
    const setUpVersionOnceBefore =
      app.getVersion() === prefs.lastSuccessfulSetupVersion;

    if (env.development) {
      logger.info(`In development, forcing full set-up`);
      await manager.upgrade();
    } else if (!setUpVersionOnceBefore) {
      logger.info(
        `Never set up ${app.getVersion()} successfully before, forcing full set-up`
      );
      await manager.upgrade();
      store.dispatch(
        actions.updatePreferences({
          lastSuccessfulSetupVersion: app.getVersion(),
        })
      );
    } else {
      logger.info(
        `Already set up ${app.getVersion()} once, doing quick set-up`
      );
      await manager.ensure({
        startup: true,
      });
    }

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

let oldInstance: Instance;

async function refreshButlerd(store: Store) {
  logger.info(`Refreshing butlerd! Spinning up new instance...`);
  let instance = await makeButlerInstance({
    rs: store.getState(),
  });
  instance.promise().catch(e => {
    console.error(`butlerd instance threw:`);
    console.error(e.stack);
    refreshButlerd(store).catch(() => {});
  });
  const endpoint = await instance.getEndpoint();

  if (oldInstance) {
    // FIXME: how about a '/lifeline' endpoint which makes
    // butler exit gracefully after all EventSources are closed ?
    // cf. https://github.com/itchio/itch/issues/1893
    oldInstance.cancel();
  }
  oldInstance = instance;

  store.dispatch(actions.gotButlerdEndpoint({ endpoint }));

  const client = new Client(endpoint);
  const versionInfo = await client.call(messages.VersionGet, {});
  logger.info(`Connected to butlerd ${versionInfo.versionString}`);
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
