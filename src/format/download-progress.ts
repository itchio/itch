import * as humanize from "humanize-plus";
import * as moment from "moment";

import { ILocalizer } from "../localizer";

interface IProgressHolder {
  bps: number;
  eta: number;
}

function humanDuration(t: ILocalizer, eta: number): string {
  const duration = moment.duration(eta, "seconds") as any;
  return duration.locale(t.lang).humanize();
}

interface IDownloadProgressOpts {
  onlyBPS?: boolean;
  onlyETA?: boolean;
}

export function downloadProgress(
  t: ILocalizer,
  holder: IProgressHolder,
  downloadsPaused: boolean,
  opts = {} as IDownloadProgressOpts,
): string {
  if (downloadsPaused) {
    return t("grid.item.downloads_paused");
  }

  if (opts.onlyBPS) {
    return `${humanize.fileSize(holder.bps)}/s`;
  }

  if (opts.onlyETA) {
    return `${humanDuration(t, holder.eta)}`;
  }

  return `${humanize.fileSize(holder.bps)}/s — ${humanDuration(t, holder.eta)}`;
}
