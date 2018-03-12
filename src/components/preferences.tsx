import * as React from "react";
import { createStructuredSelector } from "reselect";
import { connect, actionCreatorsList, Dispatchers } from "./connect";

import urls from "../constants/urls";

import Label from "./preferences/label";
import ExperimentalMark from "./preferences/experimental-mark";
import OpenAtLoginError from "./preferences/open-at-login-error";

import ProxySettings from "./preferences/proxy-settings";
import LanguageSettings from "./preferences/language-settings";
import InstallLocationsSettings from "./preferences/install-locations-settings";

import format from "./format";

import { IRootState, IPreferencesState, ILocalizedString } from "../types";

import { IMeatProps } from "./meats/types";

import styled, * as styles from "./styles";

const PreferencesDiv = styled.div`
  ${styles.meat()};
`;

const PreferencesContentDiv = styled.div`
  overflow-y: auto;
  padding: 0px 20px 30px 20px;
  font-size: 20px;

  color: ${props => props.theme.baseText};

  .heading,
  h2 {
    font-size: 18px;
  }

  h2 {
    padding: 10px 15px;
    margin-top: 20px;
    margin-bottom: 5px;
    flex-shrink: 0;

    &.toggle {
      padding-bottom: 0;

      &:hover {
        cursor: pointer;
      }
    }
  }

  .icon.turner {
    display: inline-block;
    width: 15px;
    text-align: center;
    transform: rotateZ(0deg);
    transition: transform 0.2s ease-in-out;

    &.turned {
      transform: rotateZ(90deg);
    }
  }

  .preferences-form {
    z-index: 5;
  }

  .advanced-form {
    .section {
      margin: 8px 0;

      &:first-child {
        margin-top: 0;
      }
    }

    .button:hover {
      cursor: pointer;
    }
  }

  .explanation {
    padding: 0 15px;
    margin: 15px 0 0 0;

    color: #b9b9b9;
    font-size: 14px;
    max-width: 500px;
    border-radius: $explanation-border-radius;
    line-height: 1.6;

    &.drop-down {
      animation: soft-drop 0.8s;
    }

    &.flex {
      display: flex;
      flex-shrink: 0;

      a,
      .link {
        margin-left: 8px;
        display: flex;
      }
    }

    a,
    .link {
      text-decoration: underline;
      color: #ececec;

      &:hover {
        cursor: pointer;
      }
    }
  }

  .link-box {
    margin: 20px 15px;
    font-size: 80%;

    .icon {
      margin-right: 8px;
    }

    a {
      color: #87a7c3;
      text-decoration: none;
    }
  }

  .proxy-settings {
    display: flex;
    align-items: center;
    padding: 5px 0 5px 0;

    .value {
      min-width: 150px;
      background: $explanation-color;
      padding: 0 5px;
      margin: 0 5px;
      height: 32px;
      line-height: 32px;
      color: $ivory;
      -webkit-user-select: initial;
    }
  }
`;

export class Preferences extends React.PureComponent<IProps & IDerivedProps> {
  render() {
    const {
      isolateApps,
      openAtLogin,
      openAsHidden,
      closeToTray,
      readyNotification,
      manualGameUpdates,
      preventDisplaySleep,
      showAdvanced,
    } = this.props.preferences;
    const { updatePreferences } = this.props;
    return (
      <PreferencesDiv>
        <PreferencesContentDiv>
          <LanguageSettings />

          <h2>{format(["preferences.security"])}</h2>
          <div className="security-form">
            <Label active={isolateApps}>
              <input
                type="checkbox"
                checked={isolateApps}
                onChange={e => {
                  updatePreferences({ isolateApps: e.currentTarget.checked });
                }}
              />
              <span> {format(["preferences.security.sandbox.title"])} </span>
              <ExperimentalMark />
            </Label>
          </div>

          <p className="explanation">
            {format(["preferences.security.sandbox.description"])}{" "}
            <a href={urls.sandboxDocs}>{format(["docs.learn_more"])}</a>
          </p>

          <h2>{format(["preferences.behavior"])}</h2>
          <div className="behavior-form">
            <Label active={openAtLogin}>
              <input
                type="checkbox"
                checked={openAtLogin}
                onChange={e => {
                  updatePreferences({ openAtLogin: e.currentTarget.checked });
                }}
              />
              <span> {format(["preferences.behavior.open_at_login"])} </span>
            </Label>

            <OpenAtLoginError />

            <Label active={openAsHidden}>
              <input
                type="checkbox"
                checked={openAsHidden}
                onChange={e => {
                  updatePreferences({ openAsHidden: e.currentTarget.checked });
                }}
              />
              <span> {format(["preferences.behavior.open_as_hidden"])} </span>
            </Label>

            <Label active={closeToTray}>
              <input
                type="checkbox"
                checked={closeToTray}
                onChange={e => {
                  updatePreferences({ closeToTray: e.currentTarget.checked });
                }}
              />
              <span> {format(["preferences.behavior.close_to_tray"])} </span>
            </Label>

            <Label active={manualGameUpdates}>
              <input
                type="checkbox"
                checked={manualGameUpdates}
                onChange={e => {
                  updatePreferences({
                    manualGameUpdates: e.currentTarget.checked,
                  });
                }}
              />
              <span>
                {" "}
                {format(["preferences.behavior.manual_game_updates"])}{" "}
              </span>
            </Label>

            <Label active={preventDisplaySleep}>
              <input
                type="checkbox"
                checked={preventDisplaySleep}
                onChange={e => {
                  updatePreferences({
                    preventDisplaySleep: e.currentTarget.checked,
                  });
                }}
              />
              <span>
                {" "}
                {format(["preferences.behavior.prevent_display_sleep"])}{" "}
              </span>
            </Label>
          </div>

          <h2>{format(["preferences.notifications"])}</h2>
          <div className="behavior-form">
            <Label active={readyNotification}>
              <input
                type="checkbox"
                checked={readyNotification}
                onChange={e => {
                  updatePreferences({
                    readyNotification: e.currentTarget.checked,
                  });
                }}
              />
              <span>
                {" "}
                {format(["preferences.notifications.ready_notification"])}{" "}
              </span>
            </Label>
          </div>

          <InstallLocationsSettings />

          <h2
            id="preferences-advanced-section"
            className="toggle"
            onClick={e => updatePreferences({ showAdvanced: !showAdvanced })}
          >
            <span
              className={`icon icon-triangle-right turner ${
                showAdvanced ? "turned" : ""
              }`}
            />{" "}
            {format(["preferences.advanced"])}
          </h2>
          {showAdvanced ? this.renderAdvanced() : ""}
        </PreferencesContentDiv>
      </PreferencesDiv>
    );
  }

  renderAdvanced() {
    const {
      appVersion,
      clearBrowsingDataRequest,
      navigate,
      checkForGameUpdates,
    } = this.props;

    return (
      <div className="explanation advanced-form">
        <p className="section app-version">
          itch v{appVersion}
          <span
            className="button"
            onClick={() => {
              const { checkForSelfUpdate } = this.props;
              checkForSelfUpdate({});
            }}
            style={{
              marginLeft: "10px",
              borderBottom: "1px solid",
            }}
          >
            {format(["menu.help.check_for_update"])}
          </span>
        </p>
        <p>
          <ProxySettings />
        </p>
        <p className="section">
          <span
            className="link"
            onClick={e => {
              e.preventDefault();
              navigate({ url: "itch://applog" });
            }}
          >
            {format(["preferences.advanced.open_app_log"])}
          </span>
        </p>
        <p className="section">
          <span
            className="link"
            onClick={e => {
              e.preventDefault();
              checkForGameUpdates({});
              navigate({ url: "itch://downloads" });
            }}
          >
            Check for game updates
          </span>
        </p>
        <p className="section">
          <span
            id="clear-browsing-data-link"
            className="link"
            onClick={e => {
              e.preventDefault();
              clearBrowsingDataRequest({});
            }}
          >
            {format(["preferences.advanced.clear_browsing_data"])}
          </span>
        </p>
        {this.renderAdvancedCheckbox("preferOptimizedPatches", [
          "preferences.advanced.prefer_optimized_patches",
        ])}
        {this.renderAdvancedCheckbox("disableBrowser", [
          "preferences.advanced.disable_browser",
        ])}
        {this.renderAdvancedCheckbox("disableHardwareAcceleration", [
          "preferences.advanced.disable_hardware_acceleration",
        ])}
      </div>
    );
  }

  renderAdvancedCheckbox(
    propName: keyof IDerivedProps["preferences"],
    label: ILocalizedString
  ): JSX.Element {
    const active = !!this.props.preferences[propName];
    const { updatePreferences } = this.props;

    return (
      <Label active={active}>
        <input
          type="checkbox"
          checked={active}
          onChange={e => {
            updatePreferences({
              [propName]: e.currentTarget.checked,
            });
          }}
        />
        <span>{format(label)}</span>
      </Label>
    );
  }
}

interface IProps extends IMeatProps {}

const actionCreators = actionCreatorsList(
  "updatePreferences",
  "clearBrowsingDataRequest",
  "navigate",
  "checkForSelfUpdate",
  "checkForGameUpdates"
);

type IDerivedProps = Dispatchers<typeof actionCreators> & {
  appVersion: string;
  preferences: IPreferencesState;
};

export default connect<IProps>(Preferences, {
  state: createStructuredSelector({
    appVersion: (rs: IRootState) => rs.system.appVersion,
    preferences: (rs: IRootState) => rs.preferences,
  }),
  actionCreators,
});
