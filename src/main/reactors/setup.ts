import { Client, Instance } from "butlerd";
import { actions } from "common/actions";
import { messages } from "common/butlerd";
import { makeButlerInstance } from "common/butlerd/make-butler-instance";
import env from "common/env";
import { Store } from "common/types";
import { appdataLocationPath } from "common/util/paths";
import { Watcher } from "common/util/watcher";
import { app } from "electron";
import { Manager } from "main/broth/manager";
import { mcall } from "main/butlerd/mcall";
import { mainLogger } from "main/logger";
import { mkdir } from "main/os/sf";
import { delay } from "main/reactors/delay";
import { indexBy, isEmpty } from "underscore";
import { recordingLogger } from "common/logger";

const logger = recordingLogger(mainLogger, "🔧 setup");

async function syncInstallLocations(store: Store) {
  const { installLocations } = await mcall(messages.InstallLocationsList, {});
  const newLocationsById = indexBy(installLocations, "id");

  const { preferences } = store.getState();
  if (!preferences.importedOldInstallLocations) {
    await mkdir(appdataLocationPath());
    let oldLocations = {
      ...preferences.installLocations,
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
          try {
            await mcall(messages.InstallLocationsAdd, {
              id,
              path: oldLoc.path,
            });
          } catch (e) {
            logger.warn(`Could not add ${oldLoc.path}: ${e.stack}`);
          }
        }
      }
    }

    if (numAdded > 0) {
      logger.info(`Registered ${numAdded} install locations with butler`);
    } else {
      logger.info(`All install locations synchronized with butler`);
    }
    store.dispatch(
      actions.updatePreferences({ importedOldInstallLocations: true })
    );
  }
}

export let manager: Manager;

let initialButlerdResolve: (value?: any) => void;
let initialButlerdPromise = new Promise((resolve, reject) => {
  initialButlerdResolve = resolve;
});

async function initialSetup(store: Store, { retry }: { retry: boolean }) {
  try {
    logger.info(`Setup starting...`);
    store.dispatch(
      actions.setupStatus({
        icon: "install",
        message: ["login.status.finalizing_installation"],
      })
    );

    if (!manager) {
      logger.info(`Creating broth manager`);
      manager = new Manager(store);
    }

    const prefs = store.getState().preferences;
    const setUpVersionOnceBefore =
      app.getVersion() === prefs.lastSuccessfulSetupVersion;

    logger.info(`Ensuring broth dependencies, for startup`);
    await manager.ensure({
      startup: true,
      logger,
    });

    if (env.development) {
      logger.info(`In development, forcing components upgrade check`);
      await manager.upgrade({ logger });
    } else if (!setUpVersionOnceBefore) {
      logger.info(
        `Never set up ${app.getVersion()} successfully before, forcing components upgrade check`
      );
      await manager.upgrade({ logger });
      store.dispatch(
        actions.updatePreferences({
          lastSuccessfulSetupVersion: app.getVersion(),
        })
      );
    } else {
      logger.info(
        `Already set up ${app.getVersion()} once, delaying components upgrade check`
      );
    }

    logger.debug(`Waiting for butler promise...`);
    await Promise.race([
      initialButlerdPromise,
      new Promise((resolve, reject) => {
        setTimeout(() => {
          reject(new Error("Timed out while connecting to butlerd"));
        }, 5000);
      }),
    ]);
    logger.debug(`Syncing install locations...`);
    await syncInstallLocations(store);
    logger.debug(`Dispatching setup done!`);
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
        rawError: e,
        log: logger.getLog(),
      })
    );
  }
}

interface ButlerIncarnation {
  id: number;
  instance: Instance;
  closed: boolean;
  client: Client;
}

let butlerInstanceSeed = 1;
let previousIncarnation: ButlerIncarnation;

async function refreshButlerd(store: Store) {
  logger.info(`Refreshing butlerd!`);

  let id = butlerInstanceSeed++;
  logger.info(`Spinning up butlerd instance ${id}...`);
  store.dispatch(actions.spinningUpButlerd({ startedAt: Date.now() }));
  let instance = await makeButlerInstance({
    rs: store.getState(),
  });

  let incarnation: ButlerIncarnation = {
    id,
    instance,
    closed: false,
    client: null,
  };

  instance
    .promise()
    .catch((e) => {
      logger.error(`butlerd instance ${id} threw:`);
      logger.error(e.stack);
      let endpointAtCrash = store.getState().butlerd.endpoint;
      setTimeout(() => {
        let endpointOnRestart = store.getState().butlerd.endpoint;
        if (endpointOnRestart === endpointAtCrash) {
          logger.warn(
            `Still no new butlerd endpoint 2s after butlerd instance ${id} threw, refreshing...`
          );
          refreshButlerd(store).catch(() => {});
        } else {
          logger.info(
            `Got a new endpoint after butlerd ${id} threw, all seems well.`
          );
        }
      }, 2000);
    })
    .then(() => {
      logger.info(`butlerd instance ${id} has closed.`);
      incarnation.closed = true;
    });
  logger.info(`...waiting for endpoint from butlerd instance ${id}...`);
  const endpoint = await instance.getEndpoint();
  logger.info(
    `...for butlerd instance ${id} got endpoint ${endpoint.tcp.address}`
  );

  incarnation.client = new Client(endpoint);
  incarnation.client.onWarning((msg) => {
    logger.warn(`(butlerd) ${msg}`);
  });

  const versionInfo = await incarnation.client.call(messages.VersionGet, {});
  logger.info(
    `Now speaking with butlerd instance ${id}, version ${versionInfo.versionString}, endpoint ${endpoint.tcp.address}`
  );

  store.dispatch(actions.gotButlerdEndpoint({ endpoint }));
  initialButlerdResolve();

  if (previousIncarnation) {
    await previousIncarnation.client.call(messages.MetaShutdown, {});
  }
  previousIncarnation = incarnation;
}

export default function (watcher: Watcher) {
  watcher.on(actions.boot, async (store, action) => {
    await initialSetup(store, { retry: false });
  });

  watcher.on(actions.retrySetup, async (store, action) => {
    await initialSetup(store, { retry: true });
  });

  watcher.on(actions.packageGotVersionPrefix, async (store, action) => {
    const { name } = action.payload;
    logger.debug(`Package (${name}) got version prefix`);
    if (name === "butler") {
      await refreshButlerd(store);
    }
  });
}
