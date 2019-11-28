import { Client } from "butlerd";
import { messages } from "common/butlerd";
import { queries } from "common/queries";
import { prereqsPath } from "common/util/paths";
import { MainState, broadcastPacket } from "main";
import { OnQuery } from "main/websocket-handler";
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

const logger = mainLogger.childWithName("queries-launch");

export function registerQueriesLaunch(mainState: MainState, onQuery: OnQuery) {
  onQuery(queries.launchGame, async ({ gameId }) => {
    if (!mainState.butler) {
      throw new Error(`butler is offline`);
    }
    if (!mainState.preferences) {
      throw new Error(`preferences not loaded yet`);
    }

    let client = new Client(mainState.butler.endpoint);
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
      mainState.ongoingLaunches[launchId] = launch;
      broadcastPacket(packets.launchChanged, {
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
          sandbox: mainState.preferences.isolateApps,
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
      delete mainState.ongoingLaunches[launchId];
      broadcastPacket(packets.launchEnded, { launchId });
    }
  });
}
