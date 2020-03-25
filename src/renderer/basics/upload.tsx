import { Build, Upload, UploadType } from "common/butlerd/messages";
import React from "react";
import { Icon } from "renderer/basics/Icon";
import styled from "styled-components";
import { mixins, fontSizes } from "renderer/theme";
import { fileSize } from "common/format/filesize";

const UploadTitleDiv = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  overflow: hidden;

  .spacer {
    width: 1em;
    flex-shrink: 0;
  }

  .title {
    ${mixins.singleLine};
  }
`;

interface Props {
  before?: React.ReactNode;
  after?: React.ReactNode;
  showIcon?: boolean;
  showSize?: boolean;
  upload: Upload;
}

const UploadSize = styled.div`
  margin-left: 1em;
  color: ${p => p.theme.colors.text2};

  font-size: ${fontSizes.small};
`;

export const UploadTitle = (props: Props) => {
  const { upload, before, after, showIcon = true, showSize } = props;

  return (
    <UploadTitleDiv>
      {before}
      {showIcon === true ? (
        <>
          <Icon icon={uploadIcon(upload)} />
          <div className="spacer" />
        </>
      ) : null}
      <div className="title">{formatUploadTitle(upload)}</div>
      {showSize && !!upload.size ? (
        <UploadSize>{fileSize(upload.size)}</UploadSize>
      ) : null}
      {after}
    </UploadTitleDiv>
  );
};

export function formatUploadTitle(u: Upload): string {
  return u ? u.displayName || u.filename : "?";
}

function clean(s: string) {
  return s
    .replace(/\.[a-zA-Z0-9]+$/, "")
    .replace(/[_-]/g, " ")
    .replace(/\s+/, " ");
}

export function formatUploadTitleFancy(u: Upload): string {
  if (u.displayName) {
    return u.displayName;
  }
  if (u.filename) {
    return clean(u.filename);
  }
  return "?";
}

export function formatBuildVersionInfo(b: Build): string | undefined {
  if (!b) {
    return undefined;
  }

  if (b.userVersion) {
    return `v${b.userVersion}`;
  }
  return `#${b.version}`;
}

export const uploadIcons = {
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
