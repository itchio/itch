import { MainState } from "main";
import { Client } from "butlerd";
import { messages } from "common/butlerd";
import { dialog } from "electron";
import { mainLogger } from "main/logger";
import dump from "common/util/dump";
import { hookLogging } from "main/start-butler";

const logger = mainLogger.childWithName("drive-downloads");

export interface DownloadsState {}

export function startDrivingDownloads(mainState: MainState) {
  if (mainState.downloads) {
    return;
  }

  mainState.downloads = {};
  driveDownloads(mainState);
}

async function driveDownloads(mainState: MainState) {
  const client = new Client(mainState.butler!.endpoint);
  const initialState = await client.call(messages.DownloadsList, {});
  logger.info(`initial state: ${dump(initialState)}`);

  try {
    await client.call(messages.DownloadsDrive, {}, convo => {
      hookLogging(convo, logger);

      convo.onNotification(messages.DownloadsDriveStarted, params => {
        logger.info(`started: ${dump(params)}`);
      });

      convo.onNotification(messages.DownloadsDriveProgress, params => {
        logger.info(`progress: ${dump(params)}`);
      });

      convo.onNotification(messages.DownloadsDriveFinished, params => {
        logger.info(`finished: ${dump(params)}`);
      });

      convo.onNotification(messages.DownloadsDriveErrored, params => {
        logger.info(`errored: ${dump(params)}`);
      });

      convo.onNotification(messages.DownloadsDriveDiscarded, params => {
        logger.info(`discarded: ${dump(params)}`);
      });

      convo.onNotification(messages.DownloadsDriveNetworkStatus, params => {
        logger.info(`network status: ${dump(params)}`);
      });
    });
  } catch (e) {
    logger.warn(`Downloads drive error ${e.stack}`);
  } finally {
    mainState.downloads = undefined;
  }
}
