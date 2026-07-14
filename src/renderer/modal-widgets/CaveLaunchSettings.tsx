import React from "react";
import { findWhere } from "underscore";

import * as messages from "common/butlerd/messages";
import { CaveSettings, SandboxType } from "common/butlerd/messages";
import {
  parseExtraArgs,
  parseSandboxAllowEnv,
} from "common/util/launch-settings";
import { rcall } from "renderer/butlerd/rcall";
import SimpleSelect, { BaseOptionType } from "renderer/basics/SimpleSelect";
import { hook } from "renderer/hocs/hook";
import styled from "renderer/styles";
import { T } from "renderer/t";
import { rendererLogger } from "renderer/logger";

const logger = rendererLogger.childWithName("cave-launch-settings");

const LaunchSettingsDiv = styled.div`
  width: 100%;
  margin-top: 20px;
  margin-bottom: 20px;

  h3 {
    font-size: ${(props) => props.theme.fontSizes.large};
    padding: 8px 0;
  }
`;

const SettingRow = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 12px;
  padding: 6px 0;

  > label {
    flex-basis: 240px;
    flex-shrink: 0;
  }
`;

const SettingSelect = styled(SimpleSelect)`
  flex-grow: 0;
  flex-basis: 220px;
`;

const SettingInput = styled.input`
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

type TriState = "inherit" | "on" | "off";

function toTriState(value: boolean | undefined): TriState {
  if (value === undefined) {
    return "inherit";
  }
  return value ? "on" : "off";
}

function fromTriState(value: TriState): boolean | undefined {
  if (value === "inherit") {
    return undefined;
  }
  return value === "on";
}

class CaveLaunchSettings extends React.PureComponent<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      settings: null,
      extraArgsText: "",
      allowEnvText: "",
    };
  }

  override async componentDidMount() {
    const { caveId } = this.props;
    try {
      const { settings } = await rcall(messages.CavesGetSettings, { caveId });
      this.setState({
        settings,
        extraArgsText: (settings.extraArgs || []).join(" "),
        allowEnvText: (settings.sandboxAllowEnv || []).join(", "),
      });
    } catch (e) {
      logger.error(`could not fetch cave settings: ${e}`);
    }
  }

  override render() {
    const { linux, isolateApps } = this.props;
    const { settings } = this.state;
    if (!settings) {
      return null;
    }

    const sandboxOptions = this.triStateOptions([
      "manage_cave.launch_settings.sandbox.enabled",
      "manage_cave.launch_settings.sandbox.disabled",
    ]);
    const networkOptions = this.triStateOptions([
      "manage_cave.launch_settings.network.allowed",
      "manage_cave.launch_settings.network.blocked",
    ]);
    // per-cave network override is stored as "noNetwork", flip it for display
    const networkValue = toTriState(
      settings.sandboxNoNetwork === undefined
        ? undefined
        : !settings.sandboxNoNetwork
    );

    const sandboxTypeOptions: BaseOptionType[] = [
      {
        label: ["manage_cave.launch_settings.use_default"],
        value: "inherit",
      },
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

    const sandboxEnabled = settings.sandbox ?? isolateApps;

    return (
      <LaunchSettingsDiv>
        <h3>{T(["manage_cave.launch_settings"])}</h3>

        <SettingRow>
          <label>{T(["preferences.security.sandbox.title"])}</label>
          <SettingSelect
            options={sandboxOptions}
            value={findWhere(sandboxOptions, {
              value: toTriState(settings.sandbox),
            })}
            onChange={this.onSandboxChange}
          />
        </SettingRow>

        {linux && sandboxEnabled ? (
          <>
            <SettingRow>
              <label>{T(["preferences.security.sandbox.type.label"])}</label>
              <SettingSelect
                options={sandboxTypeOptions}
                value={findWhere(sandboxTypeOptions, {
                  value: settings.sandboxType ?? "inherit",
                })}
                onChange={this.onSandboxTypeChange}
              />
            </SettingRow>

            <SettingRow>
              <label>{T(["manage_cave.launch_settings.network.label"])}</label>
              <SettingSelect
                options={networkOptions}
                value={findWhere(networkOptions, { value: networkValue })}
                onChange={this.onNetworkChange}
              />
            </SettingRow>

            <SettingRow>
              <label>
                {T(["preferences.security.sandbox.allow_env.label"])}
              </label>
              <SettingInput
                type="text"
                value={this.state.allowEnvText}
                onChange={this.onAllowEnvChange}
                onBlur={this.onAllowEnvCommit}
              />
            </SettingRow>
          </>
        ) : null}

        <SettingRow>
          <label>{T(["manage_cave.launch_settings.extra_args.label"])}</label>
          <SettingInput
            type="text"
            value={this.state.extraArgsText}
            onChange={this.onExtraArgsChange}
            onBlur={this.onExtraArgsCommit}
          />
        </SettingRow>
      </LaunchSettingsDiv>
    );
  }

  triStateOptions([onLabel, offLabel]: [string, string]): BaseOptionType[] {
    return [
      {
        label: ["manage_cave.launch_settings.use_default"],
        value: "inherit",
      },
      { label: [onLabel], value: "on" },
      { label: [offLabel], value: "off" },
    ];
  }

  onSandboxChange = (option: BaseOptionType) => {
    this.save({ sandbox: fromTriState(option.value) });
  };

  onSandboxTypeChange = (option: BaseOptionType) => {
    this.save({
      sandboxType:
        option.value === "inherit" ? undefined : (option.value as SandboxType),
    });
  };

  onNetworkChange = (option: BaseOptionType) => {
    const network = fromTriState(option.value);
    this.save({
      sandboxNoNetwork: network === undefined ? undefined : !network,
    });
  };

  onAllowEnvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({ allowEnvText: e.currentTarget.value });
  };

  onAllowEnvCommit = () => {
    const allowEnv = parseSandboxAllowEnv(this.state.allowEnvText);
    this.save({
      sandboxAllowEnv: allowEnv.length > 0 ? allowEnv : undefined,
    });
  };

  onExtraArgsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({ extraArgsText: e.currentTarget.value });
  };

  onExtraArgsCommit = () => {
    const extraArgs = parseExtraArgs(this.state.extraArgsText);
    this.save({
      extraArgs: extraArgs.length > 0 ? extraArgs : undefined,
    });
  };

  async save(patch: Partial<CaveSettings>) {
    const { caveId } = this.props;
    const settings = { ...this.state.settings, ...patch };
    this.setState({ settings });

    try {
      // Caves.SetSettings replaces the whole settings object
      await rcall(messages.CavesSetSettings, { caveId, settings });
    } catch (e) {
      logger.error(`could not save cave settings: ${e}`);
    }
  }
}

interface Props {
  caveId: string;
  linux: boolean;
  isolateApps: boolean;
}

interface State {
  settings: CaveSettings | null;
  extraArgsText: string;
  allowEnvText: string;
}

export default hook((map) => ({
  linux: map((rs) => rs.system.linux),
  isolateApps: map((rs) => rs.preferences.isolateApps),
}))(CaveLaunchSettings);
