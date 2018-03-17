import * as React from "react";
import { createStructuredSelector } from "reselect";
import { connect, actionCreatorsList, Dispatchers } from "./connect";

import ProxySettings from "./preferences/proxy-settings";
import LanguageSettings from "./preferences/language-settings";
import BehaviorSettings from "./preferences/behavior-settings";
import InstallLocationsSettings from "./preferences/install-locations-settings";
import Checkbox from "./preferences/checkbox";

import format from "./format";

import { IRootState, IPreferencesState } from "../types";

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
    const { showAdvanced } = this.props.preferences;
    const { updatePreferences } = this.props;
    return (
      <PreferencesDiv>
        <PreferencesContentDiv>
          <LanguageSettings />
          <BehaviorSettings />
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
          {showAdvanced ? this.renderAdvanced() : null}
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
        <Checkbox
          name="preferOptimizedPatches"
          label={format(["preferences.advanced.prefer_optimized_patches"])}
        />
        <Checkbox
          name="disableBrowser"
          label={format(["preferences.advanced.disable_browser"])}
        />
        <Checkbox
          name="disableHardwareAcceleration"
          label={format(["preferences.advanced.disable_hardware_acceleration"])}
        />
      </div>
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
