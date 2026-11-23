import { actions } from "common/actions";
import { formatArch, formatPlatform } from "common/format/platform";
import { ambientWind } from "common/util/navigation";
import React from "react";
import Icon from "renderer/basics/Icon";
import { useAppDispatch, useAppSelector } from "renderer/hooks/redux";
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

const AdvancedSettings = () => {
  const dispatch = useAppDispatch();
  const platform = useAppSelector((rs) => rs.system.platform);
  const arch = useAppSelector((rs) => rs.system.arch);

  const openAppLog = () => {
    dispatch(actions.navigate({ wind: "root", url: "itch://applog" }));
  };

  const checkForGameUpdates = () => {
    dispatch(actions.checkForGameUpdates({}));
    dispatch(actions.navigate({ wind: "root", url: "itch://downloads" }));
  };

  const clearBrowsingData = () => {
    dispatch(actions.clearBrowsingDataRequest({ wind: ambientWind() }));
  };

  const openSteamShortcuts = () => {
    dispatch(actions.openSteamShortcutsDialog({}));
  };

  return (
    <>
      <h2 id="preferences-advanced-section">{T(["preferences.advanced"])}</h2>
      <div className="explanation advanced-form">
        <BrothComponents />
        <div className="section">
          <Icon icon="security" /> {formatPlatform(platform)} {formatArch(arch)}
        </div>
        <div className="section">
          <ProxySettings />
        </div>
        <div className="section">
          <LinkButton type="button" onClick={openAppLog}>
            {T(["preferences.advanced.open_app_log"])}
          </LinkButton>
        </div>
        <div className="section">
          <LinkButton type="button" onClick={checkForGameUpdates}>
            {T(["preferences.advanced.check_game_updates"])}
          </LinkButton>
        </div>
        <div className="section">
          <LinkButton
            type="button"
            id="clear-browsing-data-link"
            onClick={clearBrowsingData}
          >
            {T(["preferences.advanced.clear_browsing_data"])}
          </LinkButton>
        </div>
        <div className="section">
          <LinkButton type="button" onClick={openSteamShortcuts}>
            {T(["preferences.advanced.steam_shortcuts"])}
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
};

export default AdvancedSettings;
