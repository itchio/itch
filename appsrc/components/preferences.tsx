
import * as React from "react";
import {createSelector, createStructuredSelector} from "reselect";
import {connect} from "./connect";

import {shell} from "../electron";

import * as path from "path";
import * as humanize from "humanize-plus";
import * as classNames from "classnames";

import urls from "../constants/urls";

import Icon from "./icon";
import SelectRow from "./select-row";
import {versionString} from "./hub-sidebar";

import OpenAtLoginError from "./preferences/open-at-login-error";
import ProxySettings from "./preferences/proxy-settings";

import * as actions from "../actions";

import {map, each, filter} from "underscore";

import diskspace from "../util/diskspace";

import {IState, ILocaleInfo, IPreferencesState, IInstallLocation} from "../types";
import {IAction, dispatcher} from "../constants/action-types";
import {ILocalizer} from "../localizer";

function getAppLogPath () {
  const logOpts = require("electron").remote.require("./logger");
  const logPath = logOpts.logger.opts.sinks.file;
  return logPath;
}

// TODO: split into smaller components

export class Preferences extends React.Component<IPreferencesProps, void> {
  render () {
    const {t, lang, sniffedLang = "", downloading, locales} = this.props;
    const {isolateApps, openAtLogin, openAsHidden, closeToTray,
       readyNotification, manualGameUpdates, showAdvanced} = this.props.preferences;
    const {queueLocaleDownload, updatePreferences} = this.props;

    const options = [{
      value: "__",
      label: t("preferences.language.auto", {language: sniffedLang}),
    }].concat(locales);

    let translateUrl = `${urls.itchTranslationPlatform}/projects/itch/itch`;
    if (lang !== "en" && lang !== "__") {
      translateUrl += `/${lang}`;
    }

    const translationBadgeUrl = `${urls.itchTranslationPlatform}/widgets/itch/${lang || "en"}/svg-badge.svg`;

    return <div className="preferences-meat">
      <h2>{t("preferences.language")}</h2>
      <div className="language-form">
        <label className="active">
          <SelectRow onChange={this.onLanguageChange.bind(this)} options={options} value={lang || "__"}/>

          <div className="locale-fetcher" onClick={(e) => { e.preventDefault(); queueLocaleDownload({lang}); }}>
            {downloading
              ? <Icon icon="download" classes="scan"/>
              : <Icon icon="repeat"/>
            }
          </div>
        </label>
      </div>

      <p className="explanation flex">
        {t("preferences.language.get_involved", {name: "itch"}) + " "}
        <a href={translateUrl}>
          <img className="weblate-badge" src={translationBadgeUrl}/>
        </a>
      </p>

      <h2>{t("preferences.security")}</h2>
      <div className="security-form">
        <label className={classNames({active: isolateApps})}>
          <input type="checkbox" checked={isolateApps} onChange={(e) => {
            updatePreferences({isolateApps: e.currentTarget.checked});
          }}/>
          <span> {t("preferences.security.sandbox.title")} </span>
          <span data-rh-at="bottom" data-rh={t("label.experimental")}>
            <Icon icon="lab-flask" onClick={(e: React.MouseEvent<any>) => e.preventDefault()}/>
          </span>
        </label>
      </div>

      <p className="explanation">
        {t("preferences.security.sandbox.description")}
        {" "}
        <a href={urls.sandboxDocs}>
          {t("docs.learn_more")}
        </a>
      </p>

      <h2>{t("preferences.behavior")}</h2>
      <div className="behavior-form">
        <label className={classNames({active: openAtLogin})}>
          <input type="checkbox" checked={openAtLogin} onChange={(e) => {
            updatePreferences({openAtLogin: e.currentTarget.checked});
          }}/>
          <span> {t("preferences.behavior.open_at_login")} </span>
        </label>

        <OpenAtLoginError/>

        <label className={classNames({active: openAsHidden})}>
          <input type="checkbox" checked={openAsHidden} onChange={(e) => {
            updatePreferences({openAsHidden: e.currentTarget.checked});
          }}/>
          <span> {t("preferences.behavior.open_as_hidden")} </span>
        </label>

        <label className={classNames({active: closeToTray})}>
          <input type="checkbox" checked={closeToTray} onChange={(e) => {
            updatePreferences({closeToTray: e.currentTarget.checked});
          }}/>
          <span> {t("preferences.behavior.close_to_tray")} </span>
        </label>

        <label className={classNames({active: manualGameUpdates})}>
          <input type="checkbox" checked={manualGameUpdates} onChange={(e) => {
            updatePreferences({manualGameUpdates: e.currentTarget.checked});
          }}/>
          <span> {t("preferences.behavior.manual_game_updates")} </span>
        </label>
      </div>

      <h2>{t("preferences.notifications")}</h2>
      <div className="behavior-form">
        <label className={classNames({active: readyNotification})}>
          <input type="checkbox" checked={readyNotification} onChange={(e) => {
            updatePreferences({readyNotification: e.currentTarget.checked});
          }}/>
          <span> {t("preferences.notifications.ready_notification")} </span>
        </label>
      </div>

      <h2>{t("preferences.install_locations")}</h2>
      {this.installLocationTable()}

      <h2 className="toggle" onClick={(e) => updatePreferences({showAdvanced: !showAdvanced})}>
        <span className={`icon icon-triangle-right turner ${showAdvanced ? "turned" : ""}`}/>
        {" "}
        {t("preferences.advanced")}
      </h2>
      {showAdvanced
      ? this.renderAdvanced()
      : ""}
    </div>;
  }

  renderAdvanced () {
    const {t, clearBrowsingDataRequest, updatePreferences} = this.props;
    const {preferOptimizedPatches} = this.props.preferences;

    return <div className="explanation advanced-form">
      <p className="section app-version">
      {versionString()}
      </p>
      <p>
        <ProxySettings/>
      </p>
      <p className="section">
        <span className="link" onClick={(e) => { e.preventDefault(); shell.openItem(getAppLogPath()); }}>
        {t("preferences.advanced.open_app_log")}
        </span>
      </p>
      <p className="section">
        <span className="link" onClick={(e) => { e.preventDefault(); clearBrowsingDataRequest({}); }}>
          {t("preferences.advanced.clear_browsing_data")}
        </span>
      </p>
      <label className={classNames({active: preferOptimizedPatches})}>
        <input type="checkbox" checked={preferOptimizedPatches} onChange={(e) => {
          updatePreferences({preferOptimizedPatches: e.currentTarget.checked});
        }}/>
        <span>Prefer optimized patches</span>
        <span data-rh-at="bottom" data-rh={t("label.experimental")}>
          <Icon icon="lab-flask" onClick={(e: React.MouseEvent<any>) => e.preventDefault()}/>
        </span>
      </label>
    </div>;
  }

  onLanguageChange (lang: string) {
    const {updatePreferences} = this.props;
    if (lang === "__") {
      lang = null;
    }

    updatePreferences({lang});
  }

  installLocationTable () {
    const {t, navigate} = this.props;
    const {addInstallLocationRequest,
      removeInstallLocationRequest, makeInstallLocationDefault} = this.props;

    const header = <tr className="header">
      <td>{t("preferences.install_location.path")}</td>
      <td>{t("preferences.install_location.used_space")}</td>
      <td>{t("preferences.install_location.free_space")}</td>
      <td></td>
      <td></td>
    </tr>;

    const installLocations = (this.props.installLocations || {}) as IExtendedInstallLocations;
    const {aliases, defaultLoc = "appdata", locations = []} = installLocations;

    // can't delete your last remaining location.
    const severalLocations = locations.length > 0;

    let rows: JSX.Element[] = [];
    rows.push(header);

    each(locations, (location) => {
      const {name} = location;
      const isDefault = (name === defaultLoc);
      const mayDelete = severalLocations && name !== "appdata";

      let {path} = location;
      for (const alias of aliases) {
        path = path.replace(alias[0], alias[1]);
      }
      const {size, freeSpace} = location;
      const rowClasses = classNames({
        ["default"]: isDefault,
      });

      rows.push(<tr className={rowClasses} key={`location-${name}`}>
        <td className="action path" onClick={(e) => makeInstallLocationDefault({name})}>
          <div className="default-switch"
              data-rh-at="right"
              data-rh={t("preferences.install_location." + (isDefault ? "is_default" : "make_default"))}>
            <span className="single-line">{path}</span>
            {isDefault
              ? <span className="single-line default-state">
                  ({t("preferences.install_location.is_default_short").toLowerCase()})
                 </span>
              : null
            }
          </div>
        </td>
        <td> {humanize.fileSize(size)} </td>
        <td> {freeSpace > 0 ? humanize.fileSize(freeSpace) : "..."} </td>
        <td className="action" onClick={(e) => { e.preventDefault(); navigate(`locations/${name}`); }}>
          <Icon icon="folder-open"/>
        </td>

        {mayDelete
          ? <td className="action delete"
                data-rh-at="top"
                data-rh={t("preferences.install_location.delete")}
              onClick={(e) => removeInstallLocationRequest({name})}>
            <Icon icon="cross"/>
          </td>
          : <td/>
        }
      </tr>);
    });

    rows.push(<tr>
      <td className="action add-new" onClick={(e) => { e.preventDefault(); addInstallLocationRequest({}); }}>
        <Icon icon="plus"/>
        {t("preferences.install_location.add")}
      </td>
    </tr>);

    return <table className="install-locations">
      <tbody>{rows}</tbody>
    </table>;
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

interface IPreferencesProps {
  locales: ILocaleInfo[];
  preferences: IPreferencesState;

  /** if true, we're downloading a locale right now */

  downloading: boolean;
  sniffedLang: string;
  lang: string;
  installLocations: IExtendedInstallLocations;

  t: ILocalizer;

  addInstallLocationRequest: typeof actions.addInstallLocationRequest;
  removeInstallLocationRequest: typeof actions.removeInstallLocationRequest;
  makeInstallLocationDefault: typeof actions.makeInstallLocationDefault;
  queueLocaleDownload: typeof actions.queueLocaleDownload;

  updatePreferences: typeof actions.updatePreferences;
  clearBrowsingDataRequest: typeof actions.clearBrowsingDataRequest;
  navigate: typeof actions.navigate;
}

const mapDispatchToProps = (dispatch: (action: IAction<any>) => void) => ({
  addInstallLocationRequest: dispatcher(dispatch, actions.addInstallLocationRequest),
  removeInstallLocationRequest: dispatcher(dispatch, actions.removeInstallLocationRequest),
  makeInstallLocationDefault: dispatcher(dispatch, actions.makeInstallLocationDefault),
  queueLocaleDownload: dispatcher(dispatch, actions.queueLocaleDownload),

  updatePreferences: dispatcher(dispatch, actions.updatePreferences),
  clearBrowsingDataRequest: dispatcher(dispatch, actions.clearBrowsingDataRequest),
  navigate: dispatcher(dispatch, actions.navigate),
});

const mapStateToProps = createStructuredSelector({
  preferences: (state: IState) => state.preferences,
  downloading: (state: IState) => Object.keys(state.i18n.downloading).length > 0,
  lang: (state: IState) => state.i18n.lang,
  locales: (state: IState) => state.i18n.locales,
  sniffedLang: (state: IState) => state.system.sniffedLanguage,
  installLocations: createSelector(
    (state: IState) => state.preferences.installLocations,
    (state: IState) => state.preferences.defaultInstallLocation,
    (state: IState) => state.globalMarket.caves,
    (state: IState) => state.system.homePath,
    (state: IState) => state.system.userDataPath,
    (state: IState) => state.system.diskInfo,
    (locInfos, defaultLoc, caves, homePath, userDataPath, diskInfo) => {
      if (!locInfos || !caves) {
        return {};
      }

      locInfos = {
        ...locInfos,
        appdata: {
          path: path.join(userDataPath, "apps"),
        },
      };

      const locations = filter(map(locInfos, (locInfo, name) => {
        if (locInfo.deleted) {
          return;
        }

        const isAppData = (name === "appdata");

        let itemCount = 0;
        let size = 0;
        each(caves, (cave) => {
          // TODO: handle per-user appdata ?
          if (cave.installLocation === name || (isAppData && !cave.installLocation)) {
            size += (cave.installedSize || 0);
            itemCount++;
          }
        });

        return {
          ...locInfo,
          name,
          freeSpace: diskspace.freeInFolder(diskInfo, locInfo.path),
          itemCount,
          size,
        };
      }), (x) => !!x);

      return {
        locations,
        aliases: [
          [homePath, "~"],
        ],
        defaultLoc,
      };
    },
  ),
});

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(Preferences);
