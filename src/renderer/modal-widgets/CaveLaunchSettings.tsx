import React from "react";
import { IntlShape, injectIntl } from "react-intl";
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
import { T, TString } from "renderer/t";
import { rendererLogger } from "renderer/logger";

const logger = rendererLogger.childWithName("cave-launch-settings");

const LaunchSettingsDiv = styled.div`
  width: 100%;
`;

const SectionHeading = styled.div`
  font-size: ${(props) => props.theme.fontSizes.smaller};
  font-weight: bold;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: ${(props) => props.theme.secondaryText};
  margin-bottom: 12px;
`;

const Group = styled.div`
  border: 1px solid rgba(255, 255, 255, 0.07);
  border-radius: ${(props) => props.theme.borderRadii.explanation};
  background: rgba(255, 255, 255, 0.012);
`;

/* rounds its own corners rather than letting the group clip them with
   overflow:hidden — that would also clip the focus outline and the select
   menus, which can overhang the group's bottom edge */
const GroupHeader = styled.div`
  width: 100%;
  display: flex;
  align-items: center;
  gap: 11px;
  padding: 11px 13px;
  background: ${(props) => props.theme.itemBackground};
  border-radius: 3px 3px 0 0;
  color: ${(props) => props.theme.baseText};
`;

const GroupIcon = styled.div`
  flex-shrink: 0;
  display: grid;
  place-items: center;
  width: 26px;
  height: 26px;
  border-radius: 3px;
  background: rgba(255, 255, 255, 0.05);
  color: ${(props) => props.theme.secondaryText};
`;

const GroupTitle = styled.div`
  flex: 1;
  min-width: 0;
`;

/* the app's reset leaves line-height at 1, which sits the hint's ascenders
   right on the label's descenders — these need actual leading */
const Label = styled.div`
  font-weight: bold;
  font-size: ${(props) => props.theme.fontSizes.smaller};
  line-height: 1.35;
  color: ${(props) => props.theme.baseText};
`;

const Hint = styled.div`
  color: ${(props) => props.theme.secondaryText};
  font-size: ${(props) => props.theme.fontSizes.small};
  line-height: 1.35;
  margin-top: 3px;
`;

const SettingRow = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px 0;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
`;

const GroupRows = styled.div`
  padding: 2px 13px 10px;

  /* the rules separate one row from the next — the first row is bounded by the
     group header, not by another row, so it doesn't get one. direct children
     only: rows nested in SandboxOnly still need their top rule */
  > ${SettingRow}:first-child {
    border-top: none;
  }
`;

/* dimmed, not disabled, when no sandbox is expected: these still take effect if
   the game's own manifest opts into a sandbox, and dimming keeps them
   focusable and pre-configurable in a way `disabled` would not */
const SandboxOnly = styled.div`
  &.inactive {
    opacity: 0.55;
  }
`;

const InactiveNote = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 7px;
  padding: 10px 0 2px;

  color: ${(props) => props.theme.secondaryText};
  font-size: ${(props) => props.theme.fontSizes.small};
  line-height: 1.35;
`;

const SettingLabel = styled.div`
  flex: 1;
  min-width: 0;
`;

const SettingControl = styled.div`
  flex-shrink: 0;
  width: 230px;
`;

/* a "Default" value is an inherited one, not a chosen one: it reads as
   secondary text so overridden rows stand out at a glance */
const SettingSelect = styled(SimpleSelect)`
  width: 100%;

  button[role="combobox"] {
    height: 44px;
  }

  &.is-default {
    color: ${(props) => props.theme.secondaryText};
  }
`;

const SettingInput = styled.input`
  &&& {
    width: 100%;
    height: 44px;
    margin: 0;
    padding: 8px 10px;
  }

  background: #0d0d0d;
  border: 1px solid ${(props) => props.theme.inputBorder};
  border-radius: 3px;
  box-shadow: inset 0 1px 3px #000;
  color: ${(props) => props.theme.inputText};
  font-family: monospace;
  font-size: 13px;
  transition: border-color 0.4s ease, box-shadow 0.4s ease;

  &::placeholder {
    color: ${(props) => props.theme.inputPlaceholder};
    opacity: 0.7;
  }

  &:hover {
    border-color: ${(props) => props.theme.inputBorderFocused};
  }

  &:focus {
    outline: none;
    border-color: ${(props) => props.theme.inputBorderFocused};
    box-shadow: inset 0 1px 3px #000,
      0 0 8px ${(props) => props.theme.inputBoxShadow};
  }
`;

const StandaloneRow = styled(SettingRow)`
  padding: 14px 13px;
  margin-top: 8px;
  border: 1px solid rgba(255, 255, 255, 0.07);
  border-radius: ${(props) => props.theme.borderRadii.explanation};
  background: rgba(255, 255, 255, 0.012);
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

const INHERIT = "inherit";

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

  fieldId(name: string): string {
    return `cave-${this.props.caveId}-${name}`;
  }

  hintId(name: string): string {
    return `${this.fieldId(name)}-hint`;
  }

  override render() {
    const { settings } = this.state;
    const { intl } = this.props;
    if (!settings) {
      return null;
    }

    return (
      <LaunchSettingsDiv>
        <SectionHeading>{T(["manage_cave.launch_settings"])}</SectionHeading>

        <Group>
          <GroupHeader>
            <GroupIcon aria-hidden="true">
              <span className="icon icon-security" />
            </GroupIcon>
            <GroupTitle>
              <Label>{T(["manage_cave.launch_settings.sandbox"])}</Label>
            </GroupTitle>
          </GroupHeader>
          <GroupRows>{this.renderSandboxRows(settings)}</GroupRows>
        </Group>

        <StandaloneRow>
          <SettingLabel>
            <Label as="label" htmlFor={this.fieldId("extra-args")}>
              {T(["manage_cave.launch_settings.extra_args"])}
            </Label>
            <Hint id={this.hintId("extra-args")}>
              {T(["manage_cave.launch_settings.extra_args.hint"])}
            </Hint>
          </SettingLabel>
          <SettingControl>
            <SettingInput
              type="text"
              id={this.fieldId("extra-args")}
              aria-describedby={this.hintId("extra-args")}
              value={this.state.extraArgsText}
              placeholder={TString(intl, [
                "manage_cave.launch_settings.extra_args.placeholder",
              ])}
              onChange={this.onExtraArgsChange}
              onBlur={this.onExtraArgsCommit}
            />
          </SettingControl>
        </StandaloneRow>
      </LaunchSettingsDiv>
    );
  }

  renderSandboxRows(settings: CaveSettings): JSX.Element {
    const { linux, isolateApps } = this.props;
    // what will actually happen at launch, unless the game's manifest opts in
    const sandboxExpected = settings.sandbox ?? isolateApps;

    const enableOptions = this.triStateOptions(
      "manage_cave.launch_settings.sandbox.enabled",
      "manage_cave.launch_settings.sandbox.disabled"
    );
    const networkOptions = this.triStateOptions(
      "manage_cave.launch_settings.network.allowed",
      "manage_cave.launch_settings.network.blocked"
    );
    const sandboxTypeOptions: BaseOptionType[] = [
      { label: ["manage_cave.launch_settings.use_default"], value: INHERIT },
      {
        label: ["preferences.security.sandbox.type.auto"],
        value: SandboxType.Auto,
      },
      { label: "Bubblewrap", value: SandboxType.Bubblewrap },
      { label: "Firejail", value: SandboxType.Firejail },
    ];

    // stored as noNetwork, shown as network access: flip for display
    const networkValue = toTriState(
      settings.sandboxNoNetwork === undefined
        ? undefined
        : !settings.sandboxNoNetwork
    );
    const sandboxTypeValue = settings.sandboxType ?? INHERIT;

    return (
      <>
        {this.renderSelectRow(
          "sandbox-enable",
          ["preferences.security.sandbox.title"],
          null,
          enableOptions,
          toTriState(settings.sandbox),
          this.onSandboxChange
        )}
        {linux ? (
          <>
            {sandboxExpected ? null : (
              <InactiveNote>
                {T([
                  settings.sandbox === false
                    ? "manage_cave.launch_settings.sandbox.off"
                    : "manage_cave.launch_settings.sandbox.inactive",
                ])}
              </InactiveNote>
            )}
            <SandboxOnly className={sandboxExpected ? undefined : "inactive"}>
              {this.renderSelectRow(
                "sandbox-type",
                ["preferences.security.sandbox.type.label"],
                null,
                sandboxTypeOptions,
                sandboxTypeValue,
                this.onSandboxTypeChange
              )}
              {this.renderSelectRow(
                "sandbox-network",
                ["manage_cave.launch_settings.network.label"],
                null,
                networkOptions,
                networkValue,
                this.onNetworkChange
              )}
              <SettingRow>
                <SettingLabel>
                  <Label as="label" htmlFor={this.fieldId("allow-env")}>
                    {T(["manage_cave.launch_settings.allow_env.label"])}
                  </Label>
                  <Hint id={this.hintId("allow-env")}>
                    {T(["manage_cave.launch_settings.allow_env.hint"])}
                  </Hint>
                </SettingLabel>
                <SettingControl>
                  <SettingInput
                    type="text"
                    id={this.fieldId("allow-env")}
                    aria-describedby={this.hintId("allow-env")}
                    value={this.state.allowEnvText}
                    placeholder={TString(this.props.intl, [
                      "manage_cave.launch_settings.allow_env.placeholder",
                    ])}
                    onChange={this.onAllowEnvChange}
                    onBlur={this.onAllowEnvCommit}
                  />
                </SettingControl>
              </SettingRow>
            </SandboxOnly>
          </>
        ) : null}
      </>
    );
  }

  renderSelectRow(
    name: string,
    label: string[],
    hint: string[] | null,
    options: BaseOptionType[],
    value: any,
    onChange: (option: BaseOptionType) => void
  ): JSX.Element {
    const labelId = this.fieldId(name);
    return (
      <SettingRow>
        <SettingLabel>
          <Label id={labelId}>{T(label)}</Label>
          {hint ? <Hint>{T(hint)}</Hint> : null}
        </SettingLabel>
        <SettingControl>
          <SettingSelect
            ariaLabelledBy={labelId}
            className={value === INHERIT ? "is-default" : undefined}
            options={options}
            value={findWhere(options, { value })}
            onChange={onChange}
          />
        </SettingControl>
      </SettingRow>
    );
  }

  triStateOptions(onLabel: string, offLabel: string): BaseOptionType[] {
    return [
      { label: ["manage_cave.launch_settings.use_default"], value: INHERIT },
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
        option.value === INHERIT ? undefined : (option.value as SandboxType),
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
  intl: IntlShape;
}

interface State {
  settings: CaveSettings | null;
  extraArgsText: string;
  allowEnvText: string;
}

export default injectIntl(
  hook((map) => ({
    linux: map((rs) => rs.system.linux),
    isolateApps: map((rs) => rs.preferences.isolateApps),
  }))(CaveLaunchSettings)
);
