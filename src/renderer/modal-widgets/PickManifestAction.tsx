import React from "react";
import classNames from "classnames";
import { actions } from "common/actions";
import defaultManifestIcons from "common/constants/default-manifest-icons";
import {
  Action,
  Flavor,
  LaunchStrategy,
  LaunchTarget,
  Platform,
} from "common/butlerd/messages";
import { fileSize } from "common/format/filesize";
import { ModalWidgetProps } from "common/modals";
import {
  PickManifestActionParams,
  PickManifestActionResponse,
} from "common/modals/types";
import { Dispatch } from "common/types";
import {
  launchTargetDisplayName,
  normalizeTargetPath,
} from "common/util/launch-settings";
import { ambientWind } from "common/util/navigation";
import Button from "renderer/basics/Button";
import Checkbox from "renderer/basics/Checkbox";
import Cover from "renderer/basics/Cover";
import Icon from "renderer/basics/Icon";
import { ModalButtons, ModalButtonSpacer } from "renderer/basics/modal-styles";
import { hook } from "renderer/hocs/hook";
import modals from "renderer/modals";
import styled, * as styles from "renderer/styles";
import { T, TString } from "renderer/t";
import { IntlShape } from "react-intl";
import { injectIntl } from "renderer/hocs/injectIntl";

const PickerDiv = styled.div`
  display: flex;
  flex-direction: column;
  padding: 20px;
  gap: 20px;
`;

const BodyRow = styled.div`
  display: flex;
  flex-direction: row;
  gap: 20px;
`;

const CoverColumn = styled.div`
  width: 120px;
  flex-shrink: 0;
  align-self: flex-start;
`;

const TargetsColumn = styled.div`
  flex-grow: 1;
  min-width: 420px;
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const TargetList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

/* same look as the clear browsing data list: item background, accent on the
   left edge of the chosen row. the native radio is hidden and redrawn to
   match the Checkbox component */
const TargetRow = styled.label`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
  background: ${(props) => props.theme.explanation};
  border-left: 3px solid ${(props) => props.theme.prefBorder};
  cursor: pointer;
  transition: 0.2s border ease-in-out;

  &.selected {
    border-color: ${(props) => props.theme.accent};
  }

  input {
    position: absolute;
    opacity: 0;
    width: 0;
    height: 0;
  }

  .radio {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    width: 16px;
    height: 16px;
    border: 1px solid ${(props) => props.theme.inputBorderFocused};
    border-radius: 50%;
    background: ${(props) => props.theme.inputBackground};
  }

  input:checked ~ .radio {
    background: ${(props) => props.theme.accent};
    border-color: ${(props) => props.theme.accent};
  }

  input:checked ~ .radio::after {
    content: "";
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: ${(props) => props.theme.baseBackground};
  }

  input:focus-visible ~ .radio {
    outline: 2px solid ${(props) => props.theme.accent};
    outline-offset: 2px;
  }

  .icon {
    font-size: 20px;
    flex-shrink: 0;
  }
`;

const TargetText = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;

  .name {
    ${styles.singleLine};
    font-weight: bold;
  }

  .detail {
    ${styles.singleLine};
    color: ${(props) => props.theme.secondaryText};
    font-size: ${(props) => props.theme.fontSizes.small};
  }
`;

const RememberLabel = styled.label`
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 4px;
  cursor: pointer;
`;

const RememberHint = styled.div`
  /* line up with the label text: 16px box + 10px gap */
  margin-left: 26px;
  color: ${(props) => props.theme.secondaryText};
  font-size: ${(props) => props.theme.fontSizes.small};
`;

// implicit targets are told apart by what kind of file they are, so their
// icon says the platform. anything else runnable falls back to play.
const flavorIcons: { [key: string]: string } = {
  [Flavor.NativeLinux]: "tux",
  [Flavor.NativeWindows]: "windows8",
  [Flavor.NativeMacos]: "apple",
  [Flavor.AppMacos]: "apple",
  [Flavor.HTML]: "html5",
};

// flavors that run on one OS. payloads (ROMs, .love, carts) don't, so the
// host platform butler scanned for says nothing about them
const platformFlavors = new Set<string>([
  Flavor.NativeLinux,
  Flavor.NativeWindows,
  Flavor.NativeMacos,
  Flavor.AppMacos,
  Flavor.Script,
  Flavor.ScriptWindows,
  Flavor.MSI,
]);

// butler has no launcher for most payloads and opens their folder instead
function opensFolder(action: Action, target: LaunchTarget | null): boolean {
  return (
    target?.strategy.strategy === LaunchStrategy.Shell && action.path !== "."
  );
}

function targetIcon(action: Action, target: LaunchTarget | null): string {
  if (action.icon) {
    return action.icon;
  }
  if (defaultManifestIcons[action.name]) {
    return defaultManifestIcons[action.name];
  }
  if (opensFolder(action, target)) {
    return "folder-open";
  }
  const flavor = target?.strategy.candidate?.flavor;
  if (flavor && flavorIcons[flavor]) {
    return flavorIcons[flavor];
  }
  return "play2";
}

const platformLabels: { [key: string]: string } = {
  [Platform.Linux]: "prompt.manifest_action.platform.linux",
  [Platform.Windows]: "prompt.manifest_action.platform.windows",
  [Platform.OSX]: "prompt.manifest_action.platform.osx",
};

class PickManifestAction extends React.PureComponent<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { selected: 0, remember: false };
  }

  override render() {
    const { actions, targets, game } = this.props.modal.widgetParams;
    const { selected, remember } = this.state;
    const idPrefix = `pick-manifest-action-${this.props.modal.id}`;

    return (
      <PickerDiv>
        <BodyRow>
          <CoverColumn>
            <Cover
              hover={false}
              gameId={game.id}
              coverUrl={game.coverUrl}
              stillCoverUrl={game.stillCoverUrl}
            />
          </CoverColumn>
          <TargetsColumn>
            <TargetList
              role="radiogroup"
              aria-label={TString(this.props.intl, [
                "manage_cave.launch_settings.launch_target",
              ])}
              onKeyDown={this.onKeyDown}
            >
              {actions.map((action, index) =>
                this.renderTarget(
                  action,
                  targets?.[index] ?? null,
                  index,
                  idPrefix
                )
              )}
            </TargetList>
            <RememberLabel htmlFor={`${idPrefix}-remember`}>
              <Checkbox
                id={`${idPrefix}-remember`}
                checked={remember}
                onChange={this.onRememberChange}
              />
              {T(["prompt.manifest_action.remember"])}
            </RememberLabel>
            <RememberHint>
              {T(["prompt.manifest_action.remember_hint"])}
            </RememberHint>
          </TargetsColumn>
        </BodyRow>
        <ModalButtons>
          <Button onClick={this.onCancel}>{T(["prompt.action.cancel"])}</Button>
          <ModalButtonSpacer />
          <Button
            primary
            icon="play2"
            className="pick-manifest-action-launch"
            onClick={() => this.pick(selected)}
          >
            {T(["grid.item.launch"])}
          </Button>
        </ModalButtons>
      </PickerDiv>
    );
  }

  renderTarget(
    action: Action,
    target: LaunchTarget | null,
    index: number,
    idPrefix: string
  ): JSX.Element {
    const selected = index === this.state.selected;
    const icon = targetIcon(action, target);

    const detail: JSX.Element[] = [];
    if (action.path && action.path !== ".") {
      detail.push(<span key="path">{normalizeTargetPath(action.path)}</span>);
    }
    const size = target?.strategy.candidate?.size;
    if (size) {
      detail.push(<span key="size">{fileSize(size)}</span>);
    }
    const platform = target?.host.runtime.platform;
    const flavor = target?.strategy.candidate?.flavor;
    if (
      platform &&
      platformLabels[platform] &&
      flavor &&
      platformFlavors.has(flavor)
    ) {
      detail.push(<span key="platform">{T([platformLabels[platform]])}</span>);
    }
    if (target?.host.wrapper) {
      detail.push(
        <span key="wine">{T(["prompt.manifest_action.via_wine"])}</span>
      );
    }
    if (opensFolder(action, target)) {
      detail.push(
        <span key="folder">{T(["prompt.manifest_action.opens_folder"])}</span>
      );
    }

    return (
      <TargetRow
        key={index}
        className={classNames(`action-${action.name}`, { selected })}
        onDoubleClick={() => this.pick(index)}
      >
        <input
          type="radio"
          name={`${idPrefix}-target`}
          checked={selected}
          onChange={() => this.setState({ selected: index })}
        />
        <span className="radio" aria-hidden />
        <Icon icon={icon} />
        <TargetText>
          <div className="name">
            {T([
              `action.name.${action.name}`,
              { defaultValue: launchTargetDisplayName(action) },
            ])}
          </div>
          {detail.length > 0 ? (
            <div className="detail">
              {detail.map((part, i) => (
                <React.Fragment key={i}>
                  {i > 0 ? " · " : null}
                  {part}
                </React.Fragment>
              ))}
            </div>
          ) : null}
        </TargetText>
      </TargetRow>
    );
  }

  onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      this.pick(this.state.selected);
    }
  };

  onRememberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({ remember: e.currentTarget.checked });
  };

  onCancel = () => {
    const { dispatch } = this.props;
    dispatch(actions.closeModal({ wind: ambientWind() }));
  };

  pick(index: number) {
    const { dispatch } = this.props;
    const { remember } = this.state;
    dispatch(
      actions.closeModal({
        wind: ambientWind(),
        action: modals.pickManifestAction.action({ index, remember }),
      })
    );
  }
}

interface Props
  extends ModalWidgetProps<
    PickManifestActionParams,
    PickManifestActionResponse
  > {
  dispatch: Dispatch;
  intl: IntlShape;
}

interface State {
  selected: number;
  remember: boolean;
}

export default injectIntl(hook()(PickManifestAction));
