import { messages } from "common/butlerd";
import { InstallLocationSummary } from "common/butlerd/messages";
import { fileSize } from "common/format/filesize";
import { modals } from "common/modals";
import { PreferencesState } from "common/preferences";
import { queries } from "common/queries";
import _ from "lodash";
import React, { useEffect, useState } from "react";
import { FormattedMessage } from "react-intl";
import { Button } from "renderer/basics/Button";
import { Icon } from "renderer/basics/Icon";
import { useSocket } from "renderer/contexts";
import { Dropdown } from "renderer/Dropdown";
import { HardModal } from "renderer/modals/HardModal";
import { modalWidget } from "renderer/modals/ModalRouter";
import { fontSizes } from "renderer/theme";
import { useAsync } from "renderer/use-async";
import { useAsyncCb } from "renderer/use-async-cb";
import { usePreferences } from "renderer/use-preferences";
import locales from "static/locales.json";
import styled from "styled-components";
import * as pkgInfo from "../../../package.json";

const HardPrefModal = styled(HardModal)`
  .pref-section {
    display: flex;
    flex-direction: row;
    align-items: center;

    padding: 10px 20px;

    &.collapse-top {
      padding-top: 0;
    }
    &.collapse-bottom {
      padding-bottom: 0;
    }

    .secondary {
      color: ${p => p.theme.colors.text2};
    }
  }

  .checkbox-row {
    cursor: pointer;

    > .checkbox {
      margin-right: 15px;
    }
  }

  .version-row {
    .icon {
      margin-right: 10px;
    }
  }

  .button-row {
    margin: 20px 0;

    .button {
      margin-right: 10px;

      &:last-child {
        margin-right: 0;
      }
    }
  }
`;

const SpacedIcon = styled(Icon)`
  font-size: 120%;
  margin-right: 0.6em;
`;

const PreferencesTitle = styled.div`
  font-size: ${fontSizes.large};
  font-weight: 800;
  margin-top: 1em;
  margin-bottom: 1em;
`;

export const PreferencesModal = modalWidget(modals.preferences, props => {
  const socket = useSocket();
  const preferences = usePreferences();

  const [tick, setTick] = useState(0);
  useEffect(() => {
    let interval = setInterval(() => {
      setTick(t => t + 1);
    }, 1000);
    return () => clearInterval(interval);
  });

  const [butlerVersion, setButlerVersion] = useState("...");
  useAsync(async () => {
    let { versionString } = await socket.call(messages.VersionGet, {});
    setButlerVersion(versionString);
  }, []);

  const [defaultInstallLocation, setDefaultInstallLocation] = useState<
    InstallLocationSummary | undefined
  >(undefined);
  useAsync(async () => {
    let { installLocations } = await socket.call(
      messages.InstallLocationsList,
      {}
    );
    setDefaultInstallLocation(
      _.find(
        installLocations,
        il => il.id == preferences?.defaultInstallLocation
      )
    );
  }, [preferences, tick]);

  const [onLang] = useAsyncCb(async (lang: string) => {
    await socket.query(queries.switchLanguage, {
      lang,
    });
  }, []);

  const [updatePreferences] = useAsyncCb(
    async (preferences: Partial<PreferencesState>) => {
      await socket.query(queries.updatePreferences, { preferences });
    },
    []
  );

  let checkbox = (msg: string, prop: keyof PreferencesState) => {
    let active = preferences ? !!preferences[prop] : false;
    return (
      <div
        className="pref-section checkbox-row"
        onClick={() => {
          updatePreferences({ [prop]: !active });
        }}
      >
        <SpacedIcon
          className="checkbox"
          icon={active ? "checked" : "unchecked"}
        />
        <FormattedMessage id={msg} />
      </div>
    );
  };

  return (
    <HardPrefModal
      title={<FormattedMessage id="sidebar.preferences" />}
      content={
        <>
          <PreferencesTitle>
            <FormattedMessage id="preferences.language" />
          </PreferencesTitle>
          <div className="pref-section">
            <Dropdown
              renderValue={option => (
                <>
                  <SpacedIcon icon="earth" /> {option.label}
                </>
              )}
              className="lang-dropdown"
              width={320}
              onChange={lang => onLang(lang)}
              options={[
                {
                  label: (
                    <FormattedMessage
                      id="preferences.language.auto"
                      values={{ language: window.navigator.language }}
                    />
                  ),
                  value: "__",
                },
                ...locales.locales,
              ]}
              value={preferences?.lang || "en"}
            />
          </div>
          <PreferencesTitle>
            <FormattedMessage id="preferences.install_locations" />
          </PreferencesTitle>
          <div className="pref-section">
            <SpacedIcon icon="folder-open" />{" "}
            {defaultInstallLocation ? (
              <span>
                {defaultInstallLocation.path}{" "}
                <span className="secondary">
                  (
                  <FormattedMessage id="preferences.install_location.free_space" />
                  : {fileSize(defaultInstallLocation.sizeInfo.freeSize)})
                </span>
              </span>
            ) : null}
            <span></span>
          </div>
          <div className="pref-section collapse-top button-row">
            <Button
              label={<FormattedMessage id="install_locations.manage" />}
            />
          </div>

          <PreferencesTitle>
            <FormattedMessage id="preferences.security" />
          </PreferencesTitle>
          {checkbox("preferences.security.sandbox.title", "isolateApps")}
          <PreferencesTitle>
            <FormattedMessage id="preferences.behavior" />
          </PreferencesTitle>
          {checkbox("preferences.behavior.open_at_login", "openAtLogin")}
          {checkbox("preferences.behavior.open_as_hidden", "openAsHidden")}
          {checkbox("preferences.behavior.close_to_tray", "closeToTray")}
          {checkbox(
            "preferences.behavior.manual_game_updates",
            "manualGameUpdates"
          )}
          {checkbox(
            "preferences.behavior.prevent_display_sleep",
            "preventDisplaySleep"
          )}
          <PreferencesTitle>
            <FormattedMessage id="preferences.notifications" />
          </PreferencesTitle>
          {checkbox(
            "preferences.notifications.ready_notification",
            "readyNotification"
          )}
          <PreferencesTitle>
            <FormattedMessage id="preferences.advanced" />
          </PreferencesTitle>
          <div className="pref-section version-row">
            <Icon icon="arrow-right" /> itch {pkgInfo.version}
          </div>
          <div className="pref-section version-row">
            <Icon icon="arrow-right" /> butler {butlerVersion}
          </div>
          <div className="pref-section button-row">
            <Button
              icon="book"
              label={
                <FormattedMessage id="preferences.advanced.open_app_log" />
              }
            />
            <Button
              icon="delete"
              label={
                <FormattedMessage id="preferences.advanced.clear_browsing_data" />
              }
            />
            <div style={{ flexGrow: 1 }} />
          </div>
          {checkbox(
            "preferences.advanced.disable_hardware_acceleration",
            "disableHardwareAcceleration"
          )}
        </>
      }
    />
  );
});
