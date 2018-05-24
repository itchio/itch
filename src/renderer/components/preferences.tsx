import React from "react";
import { createStructuredSelector } from "reselect";
import { connect, actionCreatorsList, Dispatchers } from "./connect";

import ProxySettings from "./preferences/proxy-settings";
import LanguageSettings from "./preferences/language-settings";
import BehaviorSettings from "./preferences/behavior-settings";
import InstallLocationsSettings from "./preferences/install-locations-settings";
import Checkbox from "./preferences/checkbox";

import { T } from "renderer/t";

import {
  IRootState,
  IPreferencesState,
  ISystemState,
  IBrothState,
} from "common/types";

import { IMeatProps } from "renderer/components/meats/types";

import styled, * as styles from "./styles";
import Icon from "./basics/icon";
import { formatPlatform, formatArch } from "common/format/platform";
import LoadingCircle from "./basics/loading-circle";
import { downloadProgress } from "common/format/download-progress";

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

      &.component {
        margin-left: 16px;
      }

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
`;

class Preferences extends React.PureComponent<IProps & IDerivedProps> {
  render() {
    const { showAdvanced } = this.props.preferences;
    const { updatePreferences } = this.props;
    return (
      <PreferencesDiv>
        <PreferencesContentDiv>
          <LanguageSettings />
          <InstallLocationsSettings />
          <BehaviorSettings />

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
            {T(["preferences.advanced"])}
          </h2>
          {showAdvanced ? this.renderAdvanced() : null}
        </PreferencesContentDiv>
      </PreferencesDiv>
    );
  }

  renderAdvanced() {
    const {
      system,
      broth,
      clearBrowsingDataRequest,
      navigate,
      checkForGameUpdates,
    } = this.props;

    return (
      <div className="explanation advanced-form">
        <p className="section">
          <Icon icon="list" /> {T(["preferences.advanced.components"])}
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
            {T(["menu.help.check_for_update"])}
          </span>
        </p>
        {Object.keys(broth.packages).map(pkgName => {
          const pkg = broth.packages[pkgName];
          return (
            <p className="section component">
              {(() => {
                switch (pkg.stage) {
                  case "idle":
                    return <Icon icon="checkmark" />;
                  case "assess":
                    return <Icon icon="stopwatch" />;
                  case "download":
                    return <Icon icon="download" />;
                  case "install":
                    return <Icon icon="install" />;
                  case "need-restart":
                    return <Icon icon="repeat" />;
                }
              })()}
              &nbsp;
              {pkgName} @ {pkg.version}
              &nbsp;
              {(() => {
                if (pkg.progressInfo) {
                  const { eta = 0, bps = 0 } = pkg.progressInfo;
                  return (
                    <>
                      &nbsp;
                      <LoadingCircle progress={pkg.progressInfo.progress} />
                      {downloadProgress({ eta, bps }, false)}
                    </>
                  );
                } else if (pkg.stage === "assess" || pkg.stage === "install") {
                  return (
                    <>
                      &nbsp;
                      <LoadingCircle progress={-1} />
                    </>
                  );
                }
                return null;
              })()}
            </p>
          );
        })}
        <p className="section">
          <Icon icon="security" /> {formatPlatform(system.platform)}{" "}
          {formatArch(system.arch)}
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
            {T(["preferences.advanced.open_app_log"])}
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
            {T(["preferences.advanced.check_game_updates"])}
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
            {T(["preferences.advanced.clear_browsing_data"])}
          </span>
        </p>
        <Checkbox
          name="preferOptimizedPatches"
          label={T(["preferences.advanced.prefer_optimized_patches"])}
        />
        <Checkbox
          name="disableBrowser"
          label={T(["preferences.advanced.disable_browser"])}
        />
        <Checkbox
          name="disableHardwareAcceleration"
          label={T(["preferences.advanced.disable_hardware_acceleration"])}
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
  preferences: IPreferencesState;
  system: ISystemState;
  broth: IBrothState;
};

export default connect<IProps>(Preferences, {
  state: createStructuredSelector({
    preferences: (rs: IRootState) => rs.preferences,
    system: (rs: IRootState) => rs.system,
    broth: (rs: IRootState) => rs.broth,
  }),
  actionCreators,
});
