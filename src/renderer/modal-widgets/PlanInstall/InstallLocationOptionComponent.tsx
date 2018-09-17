import { InstallLocationSummary } from "common/butlerd/messages";
import { fileSize } from "common/format/filesize";
import { LocalizedString } from "common/types";
import React from "react";
import Icon from "renderer/basics/Icon";
import { OptionComponentProps } from "renderer/basics/SimpleSelect/DefaultOptionComponent";
import { SelectValueDiv } from "renderer/modal-widgets/PlanInstall/select-common";
import { T } from "renderer/t";

export const InstallLocationOptionAdd = "_add";

export interface InstallLocationOption {
  value: string;
  label: LocalizedString;
  location: InstallLocationSummary;
}

export default function InstallLocationOptionComponent(
  props: OptionComponentProps<InstallLocationOption>
) {
  const l = props.option.location;
  if (!l) {
    return (
      <SelectValueDiv>
        <Icon icon="plus" />
        <div className="spacer" />
        <div className="title">{T(props.option.label)}</div>
        <div className="spacer" />
      </SelectValueDiv>
    );
  }

  return (
    <SelectValueDiv>
      <Icon icon="folder-open" />
      <div className="spacer" />
      <div className="title" title={l.path}>
        {l.path}
      </div>
      <div className="spacer" />
      <div className="tag">{fileSize(l.sizeInfo.freeSize)}</div>
      <div className="spacer" />
    </SelectValueDiv>
  );
}
