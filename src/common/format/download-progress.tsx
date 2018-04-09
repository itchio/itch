import React from "react";

import { formatDuration } from "./datetime";
import { fileSize } from "./filesize";
import { T } from "renderer/t";

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
  opts = {} as IDownloadProgressOpts
): string | JSX.Element {
  if (downloadsPaused) {
    return T(["grid.item.downloads_paused"]);
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
