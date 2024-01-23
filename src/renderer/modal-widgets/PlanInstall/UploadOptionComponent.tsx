import React from "react";
import { OptionComponentProps } from "renderer/basics/SimpleSelect/DefaultOptionComponent";
import UploadIcon from "renderer/basics/UploadIcon";
import {
  formatUploadTitleFancy,
  formatUploadTitle,
} from "common/format/upload";
import { fileSize } from "common/format/filesize";
import { SelectValueDiv } from "renderer/modal-widgets/PlanInstall/select-common";
import { Upload, Platforms, UploadType } from "common/butlerd/messages";
import PlatformIcon from "renderer/basics/PlatformIcons/PlatformIcon";
import UnknownPlatformIcon from "renderer/basics/PlatformIcons/UnknownPlatformIcon";

export interface UploadOption {
  value: number;
  label: string;
  upload: Upload;
}

export default function UploadOptionComponent(
  props: OptionComponentProps<UploadOption>
) {
  const u = props.option.upload;

  // If it's an executable and has no platform specified, show warning, that the executable may not work
  if (u.type === UploadType.Default && !hasPlatform(u.platforms)) {
    return (
      <SelectValueDiv>
        <UploadIcon upload={u} />
        <div className="spacer" />
        <div className="title" title={formatUploadTitle(u)}>
          {formatUploadTitleFancy(u)}
        </div>
        <UnknownPlatformIcon before={<div className="spacer" />} />
        <div className="spacer" />
        {u.size > 0 ? <div className="tag">{fileSize(u.size)}</div> : null}
        {u.demo ? <div className="tag">demo</div> : null}
        <div className="spacer" />
      </SelectValueDiv>
    );
  }

  return (
    <SelectValueDiv>
      <UploadIcon upload={u} />
      <div className="spacer" />
      <div className="title" title={formatUploadTitle(u)}>
        {formatUploadTitleFancy(u)}
      </div>
      <PlatformIcon
        target={u}
        field="windows"
        before={<div className="spacer" />}
      />
      <PlatformIcon
        target={u}
        field="linux"
        before={<div className="spacer" />}
      />
      <PlatformIcon
        target={u}
        field="osx"
        before={<div className="spacer" />}
      />
      <div className="spacer" />
      {u.size > 0 ? <div className="tag">{fileSize(u.size)}</div> : null}
      {u.demo ? <div className="tag">demo</div> : null}
      <div className="spacer" />
    </SelectValueDiv>
  );
}

function hasPlatform(platforms: Platforms) {
  return (
    platforms.windows !== undefined ||
    platforms.linux !== undefined ||
    platforms.osx !== undefined
  );
}
