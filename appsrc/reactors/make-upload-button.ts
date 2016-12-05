
import * as humanize from "humanize-plus";

import {
  IUploadRecord,
  ILocalizedString,
  IModalButtonTag,
} from "../types";

interface IUploadButton {
  label: ILocalizedString;
  tags: IModalButtonTag[];
  icon: string;
}

export default function makeUploadButton (upload: IUploadRecord): IUploadButton {
  let label = `${upload.displayName || upload.filename}`;
  let tags: IModalButtonTag[] = [];
  if (upload.size > 0) {
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

  return {label, tags, icon};
}
