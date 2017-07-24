import * as humanize from "humanize-plus";

import platformData from "../constants/platform-data";
import { DateTimeField, toDateTimeField } from "../db/datetime-field";

import { IUpload, ILocalizedString, IModalButtonTag } from "../types";

interface IUploadButton {
  label: ILocalizedString;
  tags: IModalButtonTag[];
  icon: string;
  timeAgo: {
    date: DateTimeField;
  };
}

interface IMakeUploadButtonOpts {
  /** Whether to show the size of uploads (default: true) */
  showSize?: boolean;
}

export default function makeUploadButton(
  upload: IUpload,
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

  if (upload.type === "html") {
    tags.push({
      icon: "earth",
    });
  }

  for (const prop of Object.keys(platformData)) {
    if ((upload as any)[prop]) {
      tags.push({
        icon: platformData[prop].icon,
      });
    }
  }

  const timeAgo = {
    date: toDateTimeField(upload.updatedAt),
  };

  const icon = "download";

  return { label, tags, icon, timeAgo };
}
