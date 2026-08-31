import classNames from "classnames";
import { OptionComponentProps } from "renderer/basics/SimpleSelect/DefaultOptionComponent";
import UploadIcon from "renderer/basics/UploadIcon";
import Icon from "renderer/basics/Icon";
import {
  formatUploadTitleFancy,
  formatUploadTitle,
} from "common/format/upload";
import { fileSize } from "common/format/filesize";
import { SelectValueDiv } from "renderer/modal-widgets/PlanInstall/select-common";
import { Upload } from "common/butlerd/messages";
import { LocalizedString } from "common/types";
import { T } from "renderer/t";
import PlatformIcon from "renderer/basics/PlatformIcons/PlatformIcon";

export interface UploadOption {
  value: number | string;
  label: LocalizedString;
  upload?: Upload;
  /** not compatible with the current platform (shown behind a reveal) */
  incompatible?: boolean;
  isHeader?: boolean;
  /** reveal-more affordance rather than a real upload */
  isAction?: boolean;
  onSelect?: () => void;
}

export default function UploadOptionComponent(
  props: OptionComponentProps<UploadOption>
) {
  const { option } = props;
  if (option.isAction) {
    return (
      <SelectValueDiv className="action">
        <Icon icon="plus" className="action-glyph" />
        <div className="title">{T(option.label)}</div>
      </SelectValueDiv>
    );
  }
  const u = option.upload;
  if (!u) {
    // group headers are rendered by SimpleSelect itself, never by us
    return null;
  }
  return (
    <SelectValueDiv
      className={classNames({ incompatible: props.option.incompatible })}
    >
      {props.option.incompatible ? (
        <Icon icon="warning" className="warning-glyph" />
      ) : null}
      <UploadIcon upload={u} />
      <div className="title" title={formatUploadTitle(u)}>
        {formatUploadTitleFancy(u)}
      </div>
      <PlatformIcon target={u} field="windows" />
      <PlatformIcon target={u} field="linux" />
      <PlatformIcon target={u} field="osx" />
      {u.size > 0 ? <div className="tag">{fileSize(u.size)}</div> : null}
      {u.demo ? <div className="tag">demo</div> : null}
    </SelectValueDiv>
  );
}
