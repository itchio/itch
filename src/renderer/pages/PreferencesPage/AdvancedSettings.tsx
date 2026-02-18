import { actions } from "common/actions";
import { formatArch, formatPlatform } from "common/format/platform";
import { Dispatch, SystemState } from "common/types";
import { ambientWind } from "common/util/navigation";
import React from "react";
import Icon from "renderer/basics/Icon";
import { hook } from "renderer/hocs/hook";
import BrothComponents from "renderer/pages/PreferencesPage/BrothComponents";
import Checkbox from "renderer/pages/PreferencesPage/Checkbox";
import ProxySettings from "renderer/pages/PreferencesPage/ProxySettings";
import { SettingsGroup } from "renderer/pages/PreferencesPage/SettingsGroup";
import styled, * as styles from "renderer/styles";
import { T } from "renderer/t";

const LinkButton = styled.button`
  ${styles.resetButton};
  text-decoration: underline;
  color: #ececec;
  cursor: pointer;
`;

class AdvancedSettings extends React.PureComponent<Props> {
  render() {
    const { system, dispatch } = this.props;

    return (
      <>
        <h2 id="preferences-advanced-section">{T(["preferences.advanced"])}</h2>
        <div className="explanation advanced-form">
          <BrothComponents />
          <div className="section">
            <Icon icon="security" /> {formatPlatform(system.platform)}{" "}
            {formatArch(system.arch)}
          </div>
          <div className="section">
            <ProxySettings />
          </div>
          <div className="section">
            <LinkButton type="button" onClick={this.openAppLog}>
              {T(["preferences.advanced.open_app_log"])}
            </LinkButton>
          </div>
          <div className="section">
            <LinkButton type="button" onClick={this.checkForGameUpdates}>
              {T(["preferences.advanced.check_game_updates"])}
            </LinkButton>
          </div>
          <div className="section">
            <LinkButton
              type="button"
              id="clear-browsing-data-link"
              onClick={this.clearBrowsingData}
            >
              {T(["preferences.advanced.clear_browsing_data"])}
            </LinkButton>
          </div>
          <SettingsGroup>
            <Checkbox
              name="disableBrowser"
              label={T(["preferences.advanced.disable_browser"])}
            />
            <Checkbox
              name="disableHardwareAcceleration"
              label={T(["preferences.advanced.disable_hardware_acceleration"])}
            />
          </SettingsGroup>
        </div>
      </>
    );
  }

  checkForGameUpdates = (e: React.MouseEvent<any>) => {
    const { dispatch } = this.props;
    e.preventDefault();
    dispatch(actions.checkForGameUpdates({}));
    dispatch(actions.navigate({ wind: "root", url: "itch://downloads" }));
  };

  openAppLog = (e: React.MouseEvent<any>) => {
    const { dispatch } = this.props;
    e.preventDefault();
    dispatch(actions.navigate({ wind: "root", url: "itch://applog" }));
  };

  clearBrowsingData = (e: React.MouseEvent<any>) => {
    const { dispatch } = this.props;
    e.preventDefault();
    dispatch(
      actions.clearBrowsingDataRequest({
        wind: ambientWind(),
      })
    );
  };
}

interface Props {
  dispatch: Dispatch;

  system: SystemState;
}

export default hook((map) => ({
  system: map((rs) => rs.system),
}))(AdvancedSettings);
