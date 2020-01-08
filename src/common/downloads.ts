import { Download, DownloadProgress } from "common/butlerd/messages";

export interface DownloadsState {
  [key: string]: DownloadWithProgress;
}

export interface DownloadWithProgress extends Download {
  progress?: DownloadProgress;
}
