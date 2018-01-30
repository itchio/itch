import * as React from "react";
import { createSelector, createStructuredSelector } from "reselect";
import { connect, actionCreatorsList, Dispatchers } from "./connect";

import * as path from "path";
import * as classNames from "classnames";

import urls from "../constants/urls";

import Icon from "./basics/icon";
import LoadingCircle from "./basics/loading-circle";
import IconButton from "./basics/icon-button";
import SelectRow from "./basics/select-row";

import OpenAtLoginError from "./preferences/open-at-login-error";
import ProxySettings from "./preferences/proxy-settings";

import TitleBar from "./title-bar";

import { map, each, filter } from "underscore";

import diskspace from "../os/diskspace";

import { fileSize } from "../format/filesize";

import { injectIntl, InjectedIntl } from "react-intl";
import format, { formatString } from "./format";

import {
  IRootState,
  ILocaleInfo,
  IPreferencesState,
  IInstallLocation,
} from "../types";

import { IMeatProps } from "./meats/types";

// TODO: split me up! before you go go
// don't let me tangle up like a yo yo
// split me up! before you go go
// refactor me toniiiiiiiiiiiiiight

import styled, * as styles from "./styles";

const PreferencesDiv = styled.div`${styles.meat()};`;

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

  .preferences-background {
    position: absolute;
    right: 0px;
    top: 30px;
  }

  .preferences-form {
    z-index: 5;
  }

  .buttons {
    float: right;
    opacity: 0.7;

    &:hover {
      opacity: 1;
      cursor: hand;
    }
  }

  .security-form,
  .behavior-form,
  .notifications-form,
  .language-form,
  .advanced-form {
    flex-shrink: 0;

    label {
      background: ${props => props.theme.explanation};
      padding: 8px 11px;
      font-size: 14px;
      display: flex;
      align-items: center;

      ${styles.prefChunk()} &.active {
        ${styles.prefChunkActive()};
      }

      input[type="checkbox"] {
        margin-right: 8px;
      }
    }

    .icon-lab-flask {
      margin-left: 8px;
    }
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

  .preferences-background {
    @include icon-as-background;
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

  .install-locations {
    width: 100%;
    font-size: 14px;
    border-collapse: collapse;
    background-color: $explanation-color;

    td {
      padding: 10px 15px;
      text-align: left;

      &:first-child {
        @include pref-chunk;
      }
    }

    tr.default {
      td {
        &:first-child {
          @include pref-chunk-active;
        }
      }
    }

    tr.header {
      td {
        background: $pref-border-color;
        color: $base-text-color;
      }
    }

    td {
      color: #999;
    }

    .borderless {
      td {
        border: none;
      }
    }

    .action {
      color: white;

      .single-line {
        @include single-line;
        width: 100%;
      }

      .default-state {
        color: #999;
        margin-left: 8px;
      }

      .icon {
        -webkit-filter: brightness(70%);
      }

      .icon-plus,
      .icon-refresh,
      .icon-stopwatch,
      .icon-folder,
      .icon-star,
      .icon-star2 {
        font-size: 80%;
        margin-right: 8px;
      }

      &:hover {
        .icon {
          -webkit-filter: none;
        }
        cursor: pointer;
      }
    }

    .icon-action {
      padding-left: 0;
      padding-right: 0;

      text-align: center;
    }
  }
`;

export class Preferences extends React.PureComponent<IProps & IDerivedProps> {
  render() {
    const {
      intl,
      tab,
      lang,
      sniffedLang = "",
      downloading,
      locales,
    } = this.props;
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
    const { queueLocaleDownload, updatePreferences } = this.props;

    const options = [
      {
        value: "__",
        label: formatString(intl, [
          "preferences.language.auto",
          { language: sniffedLang },
        ]),
      },
    ].concat(locales);

    let translateUrl = `${urls.itchTranslationPlatform}/projects/itch/itch`;
    const english = /^en/.test(lang);
    if (!english && lang !== "__") {
      translateUrl += `/${lang}`;
    }

    const badgeLang = lang ? lang.substr(0, 2) : "en";
    const translationBadgeUrl = `${urls.itchTranslationPlatform}/widgets/itch/${badgeLang}/svg-badge.svg`;

    return (
      <PreferencesDiv>
        <TitleBar tab={tab} />
        <PreferencesContentDiv>
          <h2>{format(["preferences.language"])}</h2>
          <div className="language-form">
            <label className="active">
              <SelectRow
                onChange={this.onLanguageChange}
                options={options}
                value={lang || "__"}
              />

              {downloading ? (
                <LoadingCircle progress={-1} />
              ) : (
                <IconButton
                  icon="repeat"
                  onClick={e => {
                    e.preventDefault();
                    queueLocaleDownload({ lang });
                  }}
                />
              )}
            </label>
          </div>

          <p className="explanation flex">
            {format([
              "preferences.language.get_involved",
              { name: "itch" },
            ])}{" "}
            <a href={translateUrl}>
              <img className="weblate-badge" src={translationBadgeUrl} />
            </a>
          </p>

          <h2>{format(["preferences.security"])}</h2>
          <div className="security-form">
            <label className={classNames({ active: isolateApps })}>
              <input
                type="checkbox"
                checked={isolateApps}
                onChange={e => {
                  updatePreferences({ isolateApps: e.currentTarget.checked });
                }}
              />
              <span> {format(["preferences.security.sandbox.title"])} </span>
              <span
                data-rh-at="bottom"
                data-rh={JSON.stringify(["label.experimental"])}
              >
                <Icon
                  icon="lab-flask"
                  onClick={(e: React.MouseEvent<any>) => e.preventDefault()}
                />
              </span>
            </label>
          </div>

          <p className="explanation">
            {format(["preferences.security.sandbox.description"])}{" "}
            <a href={urls.sandboxDocs}>{format(["docs.learn_more"])}</a>
          </p>

          <h2>{format(["preferences.behavior"])}</h2>
          <div className="behavior-form">
            <label className={classNames({ active: openAtLogin })}>
              <input
                type="checkbox"
                checked={openAtLogin}
                onChange={e => {
                  updatePreferences({ openAtLogin: e.currentTarget.checked });
                }}
              />
              <span> {format(["preferences.behavior.open_at_login"])} </span>
            </label>

            <OpenAtLoginError />

            <label className={classNames({ active: openAsHidden })}>
              <input
                type="checkbox"
                checked={openAsHidden}
                onChange={e => {
                  updatePreferences({ openAsHidden: e.currentTarget.checked });
                }}
              />
              <span> {format(["preferences.behavior.open_as_hidden"])} </span>
            </label>

            <label className={classNames({ active: closeToTray })}>
              <input
                type="checkbox"
                checked={closeToTray}
                onChange={e => {
                  updatePreferences({ closeToTray: e.currentTarget.checked });
                }}
              />
              <span> {format(["preferences.behavior.close_to_tray"])} </span>
            </label>

            <label className={classNames({ active: manualGameUpdates })}>
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
            </label>

            <label className={classNames({ active: preventDisplaySleep })}>
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
            </label>
          </div>

          <h2>{format(["preferences.notifications"])}</h2>
          <div className="behavior-form">
            <label className={classNames({ active: readyNotification })}>
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
            </label>
          </div>

          <h2>{format(["preferences.install_locations"])}</h2>
          {this.installLocationTable()}

          <h2
            id="preferences-advanced-section"
            className="toggle"
            onClick={e => updatePreferences({ showAdvanced: !showAdvanced })}
          >
            <span
              className={`icon icon-triangle-right turner ${showAdvanced
                ? "turned"
                : ""}`}
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
      updatePreferences,
      intl,
      navigate,
    } = this.props;
    const { preferOptimizedPatches, disableBrowser } = this.props.preferences;

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
              navigate({ tab: "applog" });
            }}
          >
            {format(["preferences.advanced.open_app_log"])}
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
        <label className={classNames({ active: preferOptimizedPatches })}>
          <input
            type="checkbox"
            checked={preferOptimizedPatches}
            onChange={e => {
              updatePreferences({
                preferOptimizedPatches: e.currentTarget.checked,
              });
            }}
          />
          <span>
            {format(["preferences.advanced.prefer_optimized_patches"])}
          </span>
          <span
            data-rh-at="bottom"
            data-rh={formatString(intl, ["label.experimental"])}
          >
            <Icon
              icon="lab-flask"
              onClick={(e: React.MouseEvent<any>) => e.preventDefault()}
            />
          </span>
        </label>
        <label className={classNames({ active: disableBrowser })}>
          <input
            type="checkbox"
            checked={disableBrowser}
            onChange={e => {
              updatePreferences({
                disableBrowser: e.currentTarget.checked,
              });
            }}
          />
          <span>{format(["preferences.advanced.disable_browser"])}</span>
        </label>
      </div>
    );
  }

  onLanguageChange = (lang: string) => {
    const { updatePreferences } = this.props;
    if (lang === "__") {
      lang = null;
    }

    updatePreferences({ lang });
  };

  installLocationTable() {
    const { navigate } = this.props;
    const {
      addInstallLocationRequest,
      removeInstallLocationRequest,
      makeInstallLocationDefault,
      intl,
    } = this.props;

    const header = (
      <tr key="header" className="header">
        <td>{format(["preferences.install_location.path"])}</td>
        <td>{format(["preferences.install_location.used_space"])}</td>
        <td>{format(["preferences.install_location.free_space"])}</td>
        <td />
        <td />
      </tr>
    );

    const installLocations = (this.props.installLocations ||
      {}) as IExtendedInstallLocations;
    const {
      aliases,
      defaultLoc = "appdata",
      locations = [],
    } = installLocations;

    // can't delete your last remaining location.
    const severalLocations = locations.length > 0;

    let rows: JSX.Element[] = [];
    rows.push(header);

    each(locations, location => {
      const { name } = location;
      const isDefault = name === defaultLoc;
      const mayDelete = severalLocations && name !== "appdata";

      let { path } = location;
      for (const alias of aliases) {
        path = path.replace(alias[0], alias[1]);
      }
      const { size, freeSpace } = location;
      const rowClasses = classNames("install-location-row", {
        ["default"]: isDefault,
      });

      rows.push(
        <tr className={rowClasses} key={`location-${name}`}>
          <td
            className="action path"
            onClick={e => makeInstallLocationDefault({ name })}
          >
            <div
              className="default-switch"
              data-rh-at="right"
              data-rh={formatString(intl, [
                "preferences.install_location." +
                  (isDefault ? "is_default" : "make_default"),
              ])}
            >
              <span className="single-line">{path}</span>
              {isDefault ? (
                <span className="single-line default-state">
                  ({formatString(intl, [
                    "preferences.install_location.is_default_short",
                  ]).toLowerCase()})
                </span>
              ) : null}
            </div>
          </td>
          <td> {fileSize(size)} </td>
          <td> {freeSpace > 0 ? fileSize(freeSpace) : "..."} </td>
          <td
            className="action icon-action install-location-navigate"
            data-rh-at="top"
            data-rh={formatString(intl, [
              "preferences.install_location.navigate",
            ])}
            onClick={e => {
              e.preventDefault();
              navigate({ tab: `locations/${name}` });
            }}
          >
            <Icon icon="arrow-right" />
          </td>

          {mayDelete ? (
            <td
              className="action icon-action delete"
              data-rh-at="top"
              data-rh={formatString(intl, [
                "preferences.install_location.delete",
              ])}
              onClick={e => removeInstallLocationRequest({ name })}
            >
              <Icon icon="cross" />
            </td>
          ) : (
            <td />
          )}
        </tr>
      );
    });

    rows.push(
      <tr key="add-new">
        <td
          className="action add-new"
          onClick={e => {
            e.preventDefault();
            addInstallLocationRequest({});
          }}
        >
          <Icon icon="plus" />
          {format(["preferences.install_location.add"])}
        </td>
      </tr>
    );

    return (
      <table className="install-locations">
        <tbody>{rows}</tbody>
      </table>
    );
  }
}

interface IExtendedInstallLocation extends IInstallLocation {
  /** some hardcoded value like 'appData' or an UUID */
  name: string;

  /** total size of installed items in this location */
  size: number;

  /** free disk space in this location */
  freeSpace: number;
}

interface IExtendedInstallLocations {
  aliases: string[][];
  defaultLoc?: string;
  locations: IExtendedInstallLocation[];
}

interface IProps extends IMeatProps {}

const actionCreators = actionCreatorsList(
  "addInstallLocationRequest",
  "removeInstallLocationRequest",
  "makeInstallLocationDefault",
  "queueLocaleDownload",
  // ---
  "updatePreferences",
  "clearBrowsingDataRequest",
  "navigate",
  "checkForSelfUpdate"
);

type IDerivedProps = Dispatchers<typeof actionCreators> & {
  locales: ILocaleInfo[];
  appVersion: string;
  preferences: IPreferencesState;

  /** if true, we're downloading a locale right now */
  downloading: boolean;
  sniffedLang: string;
  lang: string;
  installLocations: IExtendedInstallLocations;

  intl: InjectedIntl;
};

export default connect<IProps>(injectIntl(Preferences), {
  state: createStructuredSelector({
    appVersion: (rs: IRootState) => rs.system.appVersion,
    preferences: (rs: IRootState) => rs.preferences,
    downloading: (rs: IRootState) =>
      Object.keys(rs.i18n.downloading).length > 0,
    lang: (rs: IRootState) => rs.i18n.lang,
    locales: (rs: IRootState) => rs.i18n.locales,
    sniffedLang: (rs: IRootState) => rs.system.sniffedLanguage,
    installLocations: createSelector(
      (rs: IRootState) => rs.preferences.installLocations,
      (rs: IRootState) => rs.preferences.defaultInstallLocation,
      (rs: IRootState) => rs.system.homePath,
      (rs: IRootState) => rs.system.userDataPath,
      (rs: IRootState) => rs.system.diskInfo,
      (rs: IRootState) => rs.commons.locationSizes,
      (
        locInfos,
        defaultLoc,
        homePath,
        userDataPath,
        diskInfo,
        locationSizes
      ) => {
        if (!locInfos) {
          return {};
        }

        locInfos = {
          ...locInfos,
          appdata: {
            path: path.join(userDataPath, "apps"),
          },
        };

        const locations = filter(
          map(locInfos, (locInfo, name) => {
            if (locInfo.deleted) {
              return;
            }

            const size = locationSizes[name] || 0;

            return {
              ...locInfo,
              name,
              freeSpace: diskspace.freeInFolder(diskInfo, locInfo.path),
              size,
            };
          }),
          x => !!x
        );

        return {
          locations,
          aliases: [[homePath, "~"]],
          defaultLoc,
        };
      }
    ),
  }),
  actionCreators,
});
