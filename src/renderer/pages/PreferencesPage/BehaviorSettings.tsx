import React from "react";
import { findWhere } from "underscore";

import { actions } from "common/actions";
import { SandboxType } from "common/butlerd/messages";
import { Dispatch, PreferencesState } from "common/types";
import Checkbox from "renderer/pages/PreferencesPage/Checkbox";
import OpenAtLoginErrorMessage from "renderer/pages/PreferencesPage/OpenAtLoginErrorMessage";
import {
  SettingsGroup,
  SettingsGroupRow,
} from "renderer/pages/PreferencesPage/SettingsGroup";
import SimpleSelect, { BaseOptionType } from "renderer/basics/SimpleSelect";
import { hook } from "renderer/hocs/hook";
import styled from "renderer/styles";

import { T } from "renderer/t";
import urls from "common/constants/urls";

const SandboxTypeRow = styled(SettingsGroupRow)`
  gap: 12px;
`;

const SandboxTypeSelect = styled(SimpleSelect)`
  flex-grow: 0;
  flex-basis: 220px;
`;

const SandboxAllowEnvInput = styled.input`
  flex-grow: 1;
  min-width: 240px;
  background: ${(props) => props.theme.inputBackground};
  border: 1px solid ${(props) => props.theme.inputBorder};
  border-radius: 2px;
  color: ${(props) => props.theme.baseText};
  padding: 6px 8px;

  &:hover {
    border-color: ${(props) => props.theme.inputBorderFocused};
  }
`;

class BehaviorSettings extends React.PureComponent<Props> {
  render() {
    const {
      linux,
      isolateApps,
      linuxSandboxType,
      linuxSandboxNoNetwork,
      linuxSandboxAllowEnv,
    } = this.props;
    const sandboxTypeOptions: BaseOptionType[] = [
      {
        label: ["preferences.security.sandbox.type.auto"],
        value: SandboxType.Auto,
      },
      {
        label: "Bubblewrap",
        value: SandboxType.Bubblewrap,
      },
      {
        label: "Firejail",
        value: SandboxType.Firejail,
      },
    ];

    return (
      <>
        <h2>{T(["preferences.security"])}</h2>
        <div className="security-form">
          <Checkbox
            name="isolateApps"
            label={T(["preferences.security.sandbox.title"])}
          />

          {linux && isolateApps ? (
            <SettingsGroup>
              <SandboxTypeRow active>
                <span>{T(["preferences.security.sandbox.type.label"])}</span>
                <SandboxTypeSelect
                  onChange={this.onSandboxTypeChange}
                  options={sandboxTypeOptions}
                  value={
                    findWhere(sandboxTypeOptions, {
                      value: linuxSandboxType,
                    }) || sandboxTypeOptions[0]
                  }
                />
              </SandboxTypeRow>

              <SettingsGroupRow active={!!linuxSandboxNoNetwork}>
                <input
                  type="checkbox"
                  checked={!!linuxSandboxNoNetwork}
                  onChange={this.onSandboxNoNetworkChange}
                />
                <span>
                  {" "}
                  {T(["preferences.security.sandbox.no_network.title"])}{" "}
                </span>
              </SettingsGroupRow>

              <SandboxTypeRow active={!!linuxSandboxAllowEnv}>
                <span>
                  {T(["preferences.security.sandbox.allow_env.label"])}
                </span>
                <SandboxAllowEnvInput
                  type="text"
                  value={linuxSandboxAllowEnv || ""}
                  onChange={this.onSandboxAllowEnvChange}
                />
              </SandboxTypeRow>
            </SettingsGroup>
          ) : null}
        </div>

        <p className="explanation">
          {T(["preferences.security.sandbox.description"])}{" "}
          <a href={urls.sandboxDocs}>{T(["docs.learn_more"])}</a>
        </p>

        <h2>{T(["preferences.behavior"])}</h2>
        <div className="behavior-form">
          <Checkbox
            name="enableTabs"
            label={T(["preferences.behavior.enable_tabs"])}
          />

          <Checkbox
            name="openAtLogin"
            label={T(["preferences.behavior.open_at_login"])}
          />

          <OpenAtLoginErrorMessage />

          <Checkbox
            name="openAsHidden"
            label={T(["preferences.behavior.open_as_hidden"])}
          />

          <Checkbox
            name="closeToTray"
            label={T(["preferences.behavior.close_to_tray"])}
          />

          <Checkbox
            name="manualGameUpdates"
            label={T(["preferences.behavior.manual_game_updates"])}
          />

          <Checkbox
            name="preventDisplaySleep"
            label={T(["preferences.behavior.prevent_display_sleep"])}
          />
        </div>

        <h2>{T(["preferences.notifications"])}</h2>
        <div className="behavior-form">
          <Checkbox
            name="readyNotification"
            label={T(["preferences.notifications.ready_notification"])}
          />
        </div>
      </>
    );
  }

  onSandboxTypeChange = (option: BaseOptionType) => {
    if (!option) {
      return;
    }

    const selectedSandboxType =
      option.value === SandboxType.Auto
        ? undefined
        : (option.value as SandboxType);

    const { dispatch } = this.props;
    dispatch(
      actions.updatePreferences({
        linuxSandboxType: selectedSandboxType,
      })
    );
  };

  onSandboxNoNetworkChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { dispatch } = this.props;
    dispatch(
      actions.updatePreferences({
        linuxSandboxNoNetwork: e.currentTarget.checked ? true : undefined,
      })
    );
  };

  onSandboxAllowEnvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { dispatch } = this.props;
    const rawText = e.currentTarget.value;
    dispatch(
      actions.updatePreferences({
        linuxSandboxAllowEnv: rawText.trim().length > 0 ? rawText : undefined,
      })
    );
  };
}

export default hook((map) => ({
  linux: map((rs) => rs.system.linux),
  isolateApps: map((rs) => rs.preferences.isolateApps),
  linuxSandboxType: map((rs) => rs.preferences.linuxSandboxType),
  linuxSandboxNoNetwork: map((rs) => rs.preferences.linuxSandboxNoNetwork),
  linuxSandboxAllowEnv: map((rs) => rs.preferences.linuxSandboxAllowEnv),
}))(BehaviorSettings);

interface Props {
  dispatch: Dispatch;
  linux: boolean;
  isolateApps: boolean;
  linuxSandboxType: PreferencesState["linuxSandboxType"];
  linuxSandboxNoNetwork: PreferencesState["linuxSandboxNoNetwork"];
  linuxSandboxAllowEnv: PreferencesState["linuxSandboxAllowEnv"];
}
