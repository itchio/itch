import { fileSize } from "common/format/filesize";

import platformData from "common/constants/platform-data";

import { LocalizedString, ModalButtonTag } from "common/types";
import { Upload, UploadType } from "common/butlerd/messages";

interface UploadButton {
  label: LocalizedString;
  tags: ModalButtonTag[];
  icon: string;
  timeAgo: {
    date: Date | string;
  };
}

interface MakeUploadButtonOpts {
  /** Whether to show the size of uploads (default: true) */
  showSize?: boolean;
}

export function makeUploadButton(
  upload: Upload,
  opts = { showSize: true } as MakeUploadButtonOpts
): UploadButton {
  let label = `${upload.displayName || upload.filename}`;
  let tags: ModalButtonTag[] = [];

  if (upload.size > 0 && opts.showSize) {
    tags.push({
      label: `${fileSize(upload.size)}`,
    });
  }

  if (upload.demo) {
    tags.push({
      label: ["pick_update_upload.tags.demo"],
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
    date: upload.updatedAt,
  };

  const icon = uploadIcon(upload) || "download";
  return { label, tags, icon, timeAgo };
}

const uploadIcons = {
  [UploadType.Default]: "gamepad",

  [UploadType.Flash]: "neutral",
  [UploadType.Unity]: "neutral",
  [UploadType.Java]: "neutral",
  [UploadType.HTML]: "html5",

  [UploadType.Soundtrack]: "music",
  [UploadType.Book]: "book",
  [UploadType.Video]: "video",
  [UploadType.Documentation]: "book",
  [UploadType.Mod]: "shirt",
  [UploadType.AudioAssets]: "file-music",
  [UploadType.GraphicalAssets]: "images",
  [UploadType.Sourcecode]: "code",

  [UploadType.Other]: "zip",
};

export function uploadIcon(upload: Upload): string {
  return uploadIcons[upload.type];
}

// TODO: i18n that stuff
const uploadTypeHints = {
  [UploadType.Default]: "File",

  [UploadType.Flash]: "Flash embed",
  [UploadType.Unity]: "Unity embed (legacy)",
  [UploadType.Java]: "Java applet",
  [UploadType.HTML]: "HTML5 app",

  [UploadType.Soundtrack]: "Soundtrack",
  [UploadType.Book]: "Book",
  [UploadType.Video]: "Video",
  [UploadType.Documentation]: "Documentation",
  [UploadType.Mod]: "Mod",
  [UploadType.AudioAssets]: "Audio assets",
  [UploadType.GraphicalAssets]: "Graphical assets",
  [UploadType.Sourcecode]: "Source code",

  [UploadType.Other]: "Other",
};

export function uploadTypeHint(upload: Upload): string {
  return uploadTypeHints[upload.type];
}
