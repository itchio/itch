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
import { Conversation } from "../../../node_modules/butlerd/lib/client";

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
    logger.info(`Setup starting...`);
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

    await manager.ensure({
      startup: true,
    });

    if (env.development) {
      logger.info(`In development, forcing components upgrade check`);
      await manager.upgrade();
    } else if (!setUpVersionOnceBefore) {
      logger.info(
        `Never set up ${app.getVersion()} successfully before, forcing components upgrade check`
      );
      await manager.upgrade();
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
      new ItchPromise((resolve, reject) => {
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
        stack: e.stack,
      })
    );
  }
}

interface ButlerIncarnation {
  id: number;
  instance: Instance;
  convo: Conversation;
  closed: boolean;
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
    convo: null,
    closed: false,
  };

  instance
    .promise()
    .catch(e => {
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
    `...for butlerd instance ${id} got endpoint ${endpoint.http.address}`
  );

  const client = new Client(endpoint);
  const flowEstablished = new Promise<Conversation>((resolve, reject) => {
    setTimeout(() => {
      reject(new Error(`Meta.Flow call timed out for butlerd instance ${id}!`));
    }, 2000);

    client
      .call(messages.MetaFlow, {}, convo => {
        // TODO: listen for global notifications here
        convo.on(messages.MetaFlowEstablished, async () => {
          logger.info(`Meta.Flow established for butlerd instance ${id}!`);
          resolve(convo);
        });
      })
      .catch(reject);
  });
  incarnation.convo = await flowEstablished;

  const versionInfo = await client.call(messages.VersionGet, {});
  logger.info(
    `Now speaking with butlerd instance ${id}, version ${
      versionInfo.versionString
    }, endpoint ${endpoint.http.address}`
  );

  if (previousIncarnation) {
    let inc = previousIncarnation;
    let beforeCancel = Date.now();
    if (inc.convo) {
      logger.info(
        `Requesting graceful shutdown of butlerd instance ${inc.id}...`
      );
      inc.convo.cancel();
    }

    if (inc.instance) {
      logger.debug(`Waiting for butlerd instance ${inc.id} to close...`);
      let interval: NodeJS.Timer;
      let intervalMs = 1000;
      interval = setInterval(() => {
        let elapsed = Date.now() - beforeCancel;
        if (inc.closed) {
          logger.info(
            `butlerd instance ${
              inc.id
            } exited! (${elapsed.toFixed()} ms after shutdown request)`
          );
          clearInterval(interval);
        }
      }, intervalMs);
    }
  }
  previousIncarnation = incarnation;

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
    logger.debug(`Package (${name}) got version prefix`);
    if (name === "butler") {
      await refreshButlerd(store);
    }
  });
}
