import { InstallLocationSummary } from "common/butlerd/messages";
import React from "react";
import Icon from "renderer/basics/Icon";
import { OptionComponentProps } from "renderer/basics/SimpleSelect/DefaultOptionComponent";
import { SelectValueDiv } from "renderer/modal-widgets/PlanInstall/select-common";
import LocationSizeBar from "renderer/pages/LocationsPage/LocationSizeBar";
import styled from "renderer/styles";
import { fileSize } from "common/format/filesize";

export interface InstallLocationOption {
  value: string;
  label: string;
  location: InstallLocationSummary;
}

const Break = styled.div`
  flex-basis: 100%;
  width: 0;
  height: 0;
  overflow: hidden;
  margin-top: 8px;
`;

export default function InstallLocationOptionComponent(
  props: OptionComponentProps<InstallLocationOption>
) {
  const l = props.option.location;
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
