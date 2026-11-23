import React from "react";

import { actions } from "common/actions";
import { SandboxType } from "common/butlerd/messages";
import Checkbox from "renderer/pages/PreferencesPage/Checkbox";
import OpenAtLoginErrorMessage from "renderer/pages/PreferencesPage/OpenAtLoginErrorMessage";
import {
  SettingsGroup,
  SettingsGroupRow,
} from "renderer/pages/PreferencesPage/SettingsGroup";
import SimpleSelect, { BaseOptionType } from "renderer/basics/SimpleSelect";
import { useAppDispatch, useAppSelector } from "renderer/hooks/redux";
import Icon from "renderer/basics/Icon";
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

const BehaviorSettings = () => {
  const dispatch = useAppDispatch();
  const linux = useAppSelector((rs) => rs.system.linux);
  const isolateApps = useAppSelector((rs) => rs.preferences.isolateApps);
  const linuxSandboxType = useAppSelector(
    (rs) => rs.preferences.linuxSandboxType
  );
  const linuxSandboxAllowEnv = useAppSelector(
    (rs) => rs.preferences.linuxSandboxAllowEnv
  );

  const onSandboxTypeChange = (option: BaseOptionType) => {
    if (!option) {
      return;
    }
    dispatch(
      actions.updatePreferences({
        linuxSandboxType:
          option.value === SandboxType.Auto
            ? undefined
            : (option.value as SandboxType),
      })
    );
  };

  const onSandboxNoNetworkChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    dispatch(
      actions.updatePreferences({
        linuxSandboxNoNetwork: e.currentTarget.checked ? true : undefined,
      })
    );
  };

  const onSandboxAllowEnvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawText = e.currentTarget.value;
    dispatch(
      actions.updatePreferences({
        linuxSandboxAllowEnv: rawText.trim().length > 0 ? rawText : undefined,
      })
    );
  };

  return (
    <>
      <h2>{T(["preferences.security"])}</h2>
      <SettingsGroup className="security-form">
        <Checkbox
          name="isolateApps"
          label={T(["preferences.security.sandbox.title"])}
        />

        {linux && isolateApps ? (
          <SettingsGroup>
            <SandboxTypeRow active>
              <span>{T(["preferences.security.sandbox.type.label"])}</span>
              <SandboxTypeSelect
                onChange={onSandboxTypeChange}
                options={sandboxTypeOptions}
                value={
                  sandboxTypeOptions.find(
                    (o) => o.value === linuxSandboxType
                  ) || sandboxTypeOptions[0]
                }
              />
            </SandboxTypeRow>

            <Checkbox
              name="linuxSandboxNoNetwork"
              label={T(["preferences.security.sandbox.no_network.title"])}
              onChange={onSandboxNoNetworkChange}
            />

            <SandboxTypeRow active={!!linuxSandboxAllowEnv}>
              <span>{T(["preferences.security.sandbox.allow_env.label"])}</span>
              <SandboxAllowEnvInput
                type="text"
                value={linuxSandboxAllowEnv || ""}
                onChange={onSandboxAllowEnvChange}
              />
            </SandboxTypeRow>
          </SettingsGroup>
        ) : null}
      </SettingsGroup>

      <p className="explanation">
        {T(["preferences.security.sandbox.description"])}{" "}
        <a href={urls.sandboxDocs}>{T(["docs.learn_more"])}</a>
      </p>

      <p className="explanation">
        <Icon icon="warning" />{" "}
        {T(["preferences.security.sandbox.save_warning"])}{" "}
        <a href={urls.sandboxDocs}>{T(["docs.learn_more"])}</a>
      </p>

      <h2>{T(["preferences.behavior"])}</h2>
      <SettingsGroup className="behavior-form">
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
      </SettingsGroup>

      <h2>{T(["preferences.notifications"])}</h2>
      <SettingsGroup className="behavior-form">
        <Checkbox
          name="readyNotification"
          label={T(["preferences.notifications.ready_notification"])}
        />
      </SettingsGroup>
    </>
  );
};

export default BehaviorSettings;
