import {
  OngoingLaunch,
  OngoingLaunchBase,
  OngoingLaunchExiting,
  OngoingLaunchPreparing,
  OngoingLaunchRunning,
} from "common/launches";
import { modals } from "common/modals";
import { packets } from "common/packets";
import { queries } from "common/queries";
import dump from "common/util/dump";
import { prereqsPath } from "common/util/paths";
import { uuid } from "common/util/uuid";
import { shell } from "electron";
import { MainState } from "main";
import { mainLogger } from "main/logger";
import { performHTMLLaunch } from "main/perform-html-launch";
import { showModal } from "main/show-modal";
import { hookLogging } from "main/initialize-valet";
import { broadcastPacket, OnQuery } from "main/websocket-handler";
import { Cave, Client, messages } from "@itchio/valet";
import { triggerTrayMenuUpdate } from "main/tray";

const logger = mainLogger.childWithName("queries-launch");

export function registerQueriesLaunch(ms: MainState, onQuery: OnQuery) {
  onQuery(queries.getOngoingLaunches, async (params) => {
    return { launches: ms.ongoingLaunches };
  });
  onQuery(queries.launchGame, async (params) => launchGame(ms, params));
  onQuery(queries.cancelLaunch, async (params) => {
    const { launchId, reason } = params;
    ms.launchControllers[launchId]?.cancel(reason);
  });
}

export async function launchGame(
  ms: MainState,
  params: typeof queries.launchGame.__params
) {
  const { gameId } = params;
  if (ms.preparingLaunches[gameId]) {
    logger.warn(`Already launching ${gameId}, ignoring...`);
    return;
  }

  try {
    ms.preparingLaunches[gameId] = true;
    await launchGameInner(ms, params);
  } finally {
    delete ms.preparingLaunches[gameId];
    triggerTrayMenuUpdate(ms);
  }
}

async function launchGameInner(
  ms: MainState,
  params: typeof queries.launchGame.__params
) {
  const { gameId, caveId } = params;

  if (!ms.preferences) {
    throw new Error(`preferences not loaded yet`);
  }
  if (!ms.browserWindow) {
    throw new Error(`no browser window yet`);
  }

  let client = new Client();
  let items: Cave[] = [];

  type OnAbort = () => void;
  let onAbort: OnAbort[] = [];

  if (caveId) {
    let { cave } = await client.call(messages.FetchCave, { caveId });
    if (cave) {
      items = [cave];
    }
  } else {
    items = (
      await client.call(messages.FetchCaves, {
        filters: { gameId },
      })
    ).items;
  }
  if (!items || items.length == 0) {
    logger.warn(`No caves, can't launch game`);
    return;
  }
  if (items.length > 1) {
    const res = await showModal(ms, modals.pickCave, {
      items,
    });
    if (!res) {
      logger.warn(`Launch cancelled at cave selection phase`);
      return;
    }
    items = [items[res.index]];
  }

  const cave = items[0];

  let launchId = uuid();
  let base: OngoingLaunchBase = {
    caveId: cave.id,
    gameId,
    uploadId: cave.upload.id,
    buildId: cave.build ? cave.build.id : undefined,
  };

  let updateLaunch = (launch: OngoingLaunch) => {
    ms.ongoingLaunches[launchId] = launch;
    broadcastPacket(ms, packets.launchChanged, {
      launchId,
      launch,
    });
  };

  {
    let preparing: OngoingLaunchPreparing = {
      stage: "preparing",
      ...base,
    };
    updateLaunch(preparing);
  }

  try {
    await client.call(
      messages.Launch,
      {
        caveId: cave.id,
        prereqsDir: prereqsPath(),
        sandbox: ms.preferences.isolateApps,
      },
      (convo) => {
        ms.launchControllers[launchId] = {
          cancel: (reason: string) => {
            logger.warn(`Cancelling launch, reason: ${reason}`);
            convo.cancel();
          },
        };

        hookLogging(convo, logger);
        convo.onNotification(messages.PrereqsStarted, ({ tasks }) => {
          logger.info(`Handling prereqs...`);
          logger.info(`Prereqs tasks: ${dump(tasks)}`);
        });
        convo.onNotification(messages.PrereqsTaskState, () => {});
        convo.onRequest(messages.PrereqsFailed, async (params) => {
          logger.info(`Prereqs failed: ${dump(params)}`);
          // TODO: allow continuing
          return { continue: false };
        });
        convo.onRequest(messages.PickManifestAction, async (params) => {
          const { actions } = params;
          const res = await showModal(ms, modals.pickManifestAction, {
            actions,
            game: cave.game,
          });
          if (!res) {
            logger.warn(`Launch cancelled at action selection phase`);
            return { index: -1 };
          }
          return { index: res.index };
        });
        convo.onRequest(messages.HTMLLaunch, async (params) => {
          await performHTMLLaunch({
            game: cave.game,
            logger,
            params,
            onAbort: (h) => {
              onAbort.push(h);
            },
          });
          return {};
        });
        convo.onRequest(messages.URLLaunch, async (params) => {
          shell.openExternal(params.url);
          return {};
        });
        convo.onRequest(messages.ShellLaunch, async (params) => {
          await shell.openPath(params.itemPath);
          return {};
        });
        convo.onNotification(messages.PrereqsEnded, () => {
          logger.info(`Handling prereqs...done`);
        });
        convo.onNotification(messages.LaunchRunning, () => {
          triggerTrayMenuUpdate(ms);
          {
            let running: OngoingLaunchRunning = {
              stage: "running",
              ...base,
            };
            updateLaunch(running);
          }
        });
        convo.onNotification(messages.LaunchExited, () => {
          {
            let exiting: OngoingLaunchExiting = {
              stage: "exiting",
              ...base,
            };
            updateLaunch(exiting);
          }
        });
      }
    );
  } finally {
    delete ms.launchControllers[launchId];
    delete ms.ongoingLaunches[launchId];
    broadcastPacket(ms, packets.launchEnded, { launchId });
    for (const h of onAbort) {
      h();
    }
  }
}
