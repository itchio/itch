import { Client } from "butlerd";
import { messages } from "common/butlerd";
import dump from "common/util/dump";
import { MainState } from "main";
import { mainLogger } from "main/logger";
import { hookLogging } from "main/start-butler";
import { Download } from "common/butlerd/messages";
import { packets } from "common/packets";
import { broadcastPacket } from "main/websocket-handler";

const logger = mainLogger.childWithName("drive-downloads");

export interface DownloadsState {
  [key: string]: Download;
}

export function startDrivingDownloads(ms: MainState) {
  if (ms.downloads) {
    return;
  }

  driveDownloads(ms);
}

async function driveDownloads(ms: MainState) {
  try {
    ms.downloads = {};
    const client = new Client(ms.butler!.endpoint);
    const initialState = await client.call(messages.DownloadsList, {});
    logger.info(`initial state: ${dump(initialState)}`);

    await client.call(messages.DownloadsDrive, {}, convo => {
      hookLogging(convo, logger);

      convo.onNotification(messages.DownloadsDriveStarted, ({ download }) => {
        if (!ms.downloads) {
          convo.cancel();
          return;
        }
        ms.downloads[download.id] = download;
        broadcastPacket(ms, packets.downloadStarted, { download });
      });

      convo.onNotification(messages.DownloadsDriveProgress, ({ download }) => {
        if (!ms.downloads) {
          convo.cancel();
          return;
        }
        ms.downloads[download.id] = download;
        broadcastPacket(ms, packets.downloadChanged, { download });
      });

      convo.onNotification(messages.DownloadsDriveFinished, ({ download }) => {
        if (!ms.downloads) {
          convo.cancel();
          return;
        }
        ms.downloads[download.id] = download;
        broadcastPacket(ms, packets.downloadChanged, { download });
      });

      convo.onNotification(messages.DownloadsDriveErrored, ({ download }) => {
        if (!ms.downloads) {
          convo.cancel();
          return;
        }
        ms.downloads[download.id] = download;
        broadcastPacket(ms, packets.downloadChanged, { download });
      });

      convo.onNotification(messages.DownloadsDriveDiscarded, ({ download }) => {
        if (!ms.downloads) {
          convo.cancel();
          return;
        }
        delete ms.downloads[download.id];
        broadcastPacket(ms, packets.downloadCleared, { download });
      });

      convo.onNotification(
        messages.DownloadsDriveNetworkStatus,
        ({ status }) => {
          if (!ms.downloads) {
            convo.cancel();
            return;
          }
          broadcastPacket(ms, packets.networkStatusChanged, { status });
        }
      );
    });
  } catch (e) {
    logger.warn(`Downloads drive error ${e.stack}`);
  } finally {
    ms.downloads = undefined;
  }
}
