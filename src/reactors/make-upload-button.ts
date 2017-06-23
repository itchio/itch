import * as humanize from "humanize-plus";

import { IUploadRecord, ILocalizedString, IModalButtonTag } from "../types";

interface IUploadButton {
  label: ILocalizedString;
  tags: IModalButtonTag[];
  icon: string;
}

interface IMakeUploadButtonOpts {
  /** Whether to show the size of uploads (default: true) */
  showSize?: boolean;
}

export default function makeUploadButton(
  upload: IUploadRecord,
  opts = { showSize: true } as IMakeUploadButtonOpts,
): IUploadButton {
  let label = `${upload.displayName || upload.filename}`;
  let tags: IModalButtonTag[] = [];

  if (upload.size > 0 && opts.showSize) {
    tags.push({
      label: `${humanize.fileSize(upload.size)}`,
    });
  }

  if (upload.demo) {
    tags.push({
      label: ["pick_update_upload.tags.demo"],
    });
  }

  const icon = "download";

  return { label, tags, icon };
}
