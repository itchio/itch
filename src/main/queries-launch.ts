import { Client } from "butlerd";
import { messages } from "common/butlerd";
import { queries } from "common/queries";
import { prereqsPath } from "common/util/paths";
import { MainState } from "main";
import { OnQuery, broadcastPacket } from "main/websocket-handler";
import { hookLogging } from "main/start-butler";
import { mainLogger } from "main/logger";
import {
  OngoingLaunchBase,
  OngoingLaunchPreparing,
  OngoingLaunchRunning,
  OngoingLaunch,
  OngoingLaunchExiting,
} from "common/launches";
import { uuid } from "common/util/uuid";
import { packets } from "common/packets";
import dump from "common/util/dump";
import { shell } from "electron";

const logger = mainLogger.childWithName("queries-launch");

export function registerQueriesLaunch(ms: MainState, onQuery: OnQuery) {
  onQuery(queries.launchGame, async ({ gameId }) => {
    if (!ms.butler) {
      throw new Error(`butler is offline`);
    }
    if (!ms.preferences) {
      throw new Error(`preferences not loaded yet`);
    }

    let client = new Client(ms.butler.endpoint);
    const { items } = await client.call(messages.FetchCaves, {
      filters: { gameId },
    });
    if (!items || items.length == 0) {
      console.warn(`No caves, can't launch game`);
    }
    if (items.length > 1) {
      // FIXME: handle multiple caves
      throw new Error(`multiple caves present, not sure what to do`);
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
        convo => {
          hookLogging(convo, logger);
          convo.onNotification(messages.PrereqsStarted, ({ tasks }) => {
            logger.info(`Handling prereqs...`);
            logger.info(`Prereqs tasks: ${dump(tasks)}`);
          });
          convo.onNotification(messages.PrereqsTaskState, () => {});
          convo.onRequest(messages.PrereqsFailed, async params => {
            logger.info(`Prereqs failed: ${dump(params)}`);
            // TODO: allow continuing
            return { continue: false };
          });
          convo.onRequest(messages.ShellLaunch, async params => {
            shell.openItem(params.itemPath);
            return {};
          });
          convo.onNotification(messages.PrereqsEnded, () => {
            logger.info(`Handling prereqs...done`);
          });
          convo.onNotification(messages.LaunchRunning, () => {
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
      delete ms.ongoingLaunches[launchId];
      broadcastPacket(ms, packets.launchEnded, { launchId });
    }
  });
}
