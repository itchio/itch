import { Download, DownloadProgress } from "@itchio/valet";

export interface DownloadsState {
  [key: string]: DownloadWithProgress;
}

export interface DownloadWithProgress extends Download {
  progress?: DownloadProgress;
}
