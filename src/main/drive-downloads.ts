import { Client } from "butlerd";
import { isCancelled, messages } from "common/butlerd";
import { Download, DownloadProgress } from "common/butlerd/messages";
import { packets } from "common/packets";
import { MainState } from "main";
import { mainLogger } from "main/logger";
import { hookLogging } from "main/start-butler";
import { broadcastPacket } from "main/websocket-handler";

const logger = mainLogger.childWithName("drive-downloads");

export interface DownloadWithProgress extends Download {
  progress?: DownloadProgress;
}

export interface DownloadsState {
  [key: string]: DownloadWithProgress;
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
    for (const download of initialState.downloads) {
      ms.downloads[download.id] = download;
    }

    await client.call(messages.DownloadsDrive, {}, convo => {
      hookLogging(convo, logger);

      convo.onNotification(messages.DownloadsDriveStarted, ({ download }) => {
        if (!ms.downloads) {
          convo.cancel();
          return;
        }
        let dwp = {
          ...download,
          progress: {
            progress: 0.0,
            bps: 0,
            eta: 0,
            stage: "prepare",
          },
        };
        ms.downloads[download.id] = dwp;
        broadcastPacket(ms, packets.downloadStarted, { download: dwp });
      });

      convo.onNotification(
        messages.DownloadsDriveProgress,
        ({ download, progress }) => {
          if (!ms.downloads) {
            convo.cancel();
            return;
          }
          let dwp = { ...download, progress };
          ms.downloads[download.id] = dwp;
          broadcastPacket(ms, packets.downloadChanged, { download: dwp });
        }
      );

      convo.onNotification(messages.DownloadsDriveFinished, ({ download }) => {
        if (!ms.downloads) {
          convo.cancel();
          return;
        }
        ms.downloads[download.id] = download;
        broadcastPacket(ms, packets.downloadChanged, { download });

        (async () => {
          if (!download.caveId) {
            return;
          }
          const { cave } = await convo.call(messages.FetchCave, {
            caveId: download.caveId,
          });
          broadcastPacket(ms, packets.gameInstalled, { cave });
        })().catch(e => {
          console.warn("While fetching cave after download finished", e.stack);
        });
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
    if (isCancelled(e)) {
      // alright then
    } else {
      logger.warn(`Downloads drive error ${e.stack}`);
    }
  } finally {
    ms.downloads = undefined;
  }
}
