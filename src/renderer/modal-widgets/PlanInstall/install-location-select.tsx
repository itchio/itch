import { InstallLocationSummary } from "common/butlerd/messages";
import { fileSize } from "common/format/filesize";
import { css } from "emotion";
import React from "react";
import { SelectComponents } from "react-select/lib/components";
import { OptionProps } from "react-select/lib/components/Option";
import { SingleValueProps } from "react-select/lib/components/SingleValue";
import Icon from "renderer/basics/Icon";
import { SelectValueDiv } from "renderer/modal-widgets/PlanInstall/select-common";

export interface InstallLocationOption {
  value: string;
  label: string;
  location: InstallLocationSummary;
}

const InstallLocationValueContents = (props: {
  location: InstallLocationSummary;
}) => {
  const l = props.location;
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
};

const UploadValue = (props: SingleValueProps<InstallLocationOption>) => {
  const { data, getStyles, className, cx, innerProps } = props;
  return (
    <div
      className={
        cx(css(getStyles("singleValue", props)), {}, className) as string
      }
      {...innerProps}
    >
      <InstallLocationValueContents location={data.location} />
    </div>
  );
};

const UploadOption = (
  props: OptionProps<InstallLocationOption> & { data: InstallLocationOption }
) => {
  const {
    data,
    getStyles,
    cx,
    isFocused,
    isSelected,
    isDisabled,
    className,
    innerProps,
  } = props;
  return (
    <div
      className={
        cx(
          css(getStyles("option", props)),
          {
            option: true,
            "option--is-disabled": isDisabled,
            "option--is-focused": isFocused,
            "option--is-selected": isSelected,
          },
          className
        ) as string
      }
      {...innerProps}
    >
      <InstallLocationValueContents location={data.location} />
    </div>
  );
};

export const installLocationSelectComponents: Partial<
  SelectComponents<InstallLocationOption>
> = {
  SingleValue: UploadValue,
  Option: UploadOption as any,
};
