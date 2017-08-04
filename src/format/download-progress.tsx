import * as React from "react";

import format from "../components/format";
import { formatDuration } from "./datetime";
import { fileSize } from "./filesize";

interface IProgressHolder {
  bps: number;
  eta: number;
}

interface IDownloadProgressOpts {
  onlyBPS?: boolean;
  onlyETA?: boolean;
}

export function downloadProgress(
  holder: IProgressHolder,
  downloadsPaused: boolean,
  opts = {} as IDownloadProgressOpts,
): string | JSX.Element {
  if (downloadsPaused) {
    return format(["grid.item.downloads_paused"]);
  }

  if (opts.onlyBPS) {
    return `${fileSize(holder.bps)}/s`;
  }

  if (opts.onlyETA) {
    return formatDuration(holder.eta);
  }

  return (
    <span>
      {fileSize(holder.bps)}
      {"/s — "}
      {formatDuration(holder.eta)}
    </span>
  );
}
