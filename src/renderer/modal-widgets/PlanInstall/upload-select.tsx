import { Upload } from "common/butlerd/messages";
import { fileSize } from "common/format/filesize";
import { formatUploadTitleFancy } from "common/format/upload";
import { css } from "emotion";
import React from "react";
import { SelectComponents } from "react-select/lib/components";
import { OptionProps } from "react-select/lib/components/Option";
import { SingleValueProps } from "react-select/lib/components/SingleValue";
import UploadIcon from "renderer/basics/UploadIcon";
import { SelectValueDiv } from "renderer/modal-widgets/PlanInstall/select-common";

export interface UploadOption {
  value: number;
  label: string;
  upload: Upload;
}

const UploadValueContents = (props: { upload: Upload }) => {
  const u = props.upload;
  return (
    <SelectValueDiv>
      <UploadIcon upload={u} />
      <div className="spacer" />
      <div className="title" title={formatUploadTitleFancy(u)}>
        {formatUploadTitleFancy(u)}
      </div>
      <div className="spacer" />
      {u.size > 0 ? <div className="tag">{fileSize(u.size)}</div> : null}
      {u.demo ? <div className="tag">demo</div> : null}
      <div className="spacer" />
    </SelectValueDiv>
  );
};

const UploadValue = (props: SingleValueProps<UploadOption>) => {
  const { data, getStyles, className, cx, innerProps } = props;
  const u = data.upload;
  return (
    <div
      className={
        cx(css(getStyles("singleValue", props)), {}, className) as string
      }
      {...innerProps}
    >
      <UploadValueContents upload={u} />
    </div>
  );
};

const UploadOption = (
  props: OptionProps<UploadOption> & { data: UploadOption }
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
  const u = data.upload;
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
      <UploadValueContents upload={u} />
    </div>
  );
};

export const uploadSelectComponents: Partial<SelectComponents<UploadOption>> = {
  SingleValue: UploadValue,
  Option: UploadOption as any,
};
