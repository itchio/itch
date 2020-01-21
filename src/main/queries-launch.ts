import { Client } from "butlerd";
import { messages } from "common/butlerd";
import {
  OngoingLaunch,
  OngoingLaunchBase,
  OngoingLaunchExiting,
  OngoingLaunchPreparing,
  OngoingLaunchRunning,
} from "common/launches";
import { packets } from "common/packets";
import { queries } from "common/queries";
import dump from "common/util/dump";
import { prereqsPath } from "common/util/paths";
import { uuid } from "common/util/uuid";
import { dialog, shell } from "electron";
import { MainState } from "main";
import { mainLogger } from "main/logger";
import { performHTMLLaunch } from "main/perform-html-launch";
import { hookLogging } from "main/start-butler";
import { broadcastPacket, OnQuery } from "main/websocket-handler";
import { formatUploadTitle } from "renderer/basics/upload";

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
    let { items } = await client.call(messages.FetchCaves, {
      filters: { gameId },
    });
    if (!items || items.length == 0) {
      logger.warn(`No caves, can't launch game`);
      return;
    }
    if (items.length > 1) {
      let { response } = await dialog.showMessageBox(ms.browserWindow, {
        type: "question",
        buttons: [...items.map(c => formatUploadTitle(c.upload)), "Cancel"],
        message: "Which file do you want to launch?",
        cancelId: items.length,
      });
      if (response >= 0 && response < items.length) {
        items = [items[response]];
      } else {
        logger.warn(`Launch cancelled at cave selection phase`);
      }
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
          convo.onRequest(messages.HTMLLaunch, async params => {
            await performHTMLLaunch({
              game: cave.game,
              logger,
              params,
              onAbort: h => {
                logger.warn(
                  `queries-launch / performHTMLLaunch / onAbort: stub`
                );
              },
            });
            return {};
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
