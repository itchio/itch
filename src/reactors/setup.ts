import { Watcher } from "./watcher";

import { installFormula } from "../util/ibrew";

import { IStore, ILocalizedString } from "../types";
import { Context } from "../context";

import { actions } from "../actions";

import rootLogger from "../logger";
import { withButlerClient, messages } from "../buse/index";
import { indexBy, isEmpty } from "underscore";
import { appdataLocationPath } from "../os/paths";
const logger = rootLogger.child({ name: "setup" });

async function fetch(ctx: Context, name: string) {
  const opts = {
    ctx,
    logger,
    onStatus: (icon: string, message: ILocalizedString) => {
      ctx.store.dispatch(
        actions.setupStatus({ icon, message, bps: 0, eta: 0 })
      );
    },
  };
  ctx.on("progress", progress => {
    ctx.store.dispatch(actions.setupOperationProgress({ progress }));
  });

  await installFormula(opts, name);
}

async function setup(store: IStore) {
  const ctx = new Context(store);

  logger.info("setup starting");
  await fetch(ctx, "butler");
  logger.info("all deps done");

  await syncInstallLocations(store);
  store.dispatch(actions.setupDone({}));
}

async function syncInstallLocations(store: IStore) {
  await withButlerClient(logger, async client => {
    const { installLocations } = await client.call(
      messages.InstallLocationsList({})
    );
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
          await client.call(
            messages.InstallLocationsAdd({
              id,
              path: oldLoc.path,
            })
          );
        }
      }
    }

    if (numAdded > 0) {
      logger.info(`Registered ${numAdded} install locations with butler`);
    } else {
      logger.info(`All install locations synchronized with butler`);
    }
  });
}

async function doSetup(store: IStore) {
  try {
    await setup(store);
  } catch (e) {
    logger.error(`setup got error: ${e.stack}`);

    store.dispatch(
      actions.setupStatus({
        icon: "error",
        message: ["login.status.setup_failure", { error: e.message || "" + e }],
        stack: e.stack,
        bps: 0,
        eta: 0,
      })
    );
  }
}

export default function(watcher: Watcher) {
  watcher.on(actions.boot, async (store, action) => {
    await doSetup(store);
  });

  watcher.on(actions.retrySetup, async (store, action) => {
    await doSetup(store);
  });
}
