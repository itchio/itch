
// TODO: oh god please break me down into pieces
// please please
// I beg of you
// I'm too large for my own good

import * as React from "react";
import * as classNames from "classnames";
import {connect, I18nProps} from "./connect";

import * as moment from "moment";
import {map, debounce} from "underscore";
import {createSelector, createStructuredSelector} from "reselect";

import * as actions from "../actions";
import {pathToIcon, makeLabel} from "../util/navigation";

import {app} from "electron";
const appVersion = app.getVersion();

import HubSidebarItem from "./hub-sidebar-item";
import UserMenu from "./user-menu";
import Ink = require("react-ink");

import {IAppState, IUserRecord, IGameRecord, ITabDataSet, ILocalizedString} from "../types";
import {dispatcher} from "../constants/action-types";

import watching, {Watcher} from "./watching";

import {SortableElement, SortableContainer, arrayMove} from "react-sortable-hoc";

interface ISortEndParams {
  oldIndex: number;
  newIndex: number;
}

interface ISortableHubSidebarItemProps {
  props: any & {
    id: string;
  };
}

const SortableHubSidebarItem = SortableElement((props: ISortableHubSidebarItemProps) => {
  return <HubSidebarItem {...props.props}/>;
});

interface ISortableContainerParams {
  items: string[];
  sidebarProps: IProps & IDerivedProps & I18nProps;
}

const SortableList = SortableContainer((params: ISortableContainerParams) => {
  const {sidebarProps, items} = params;
  const {t, tabData, id: currentId, loadingTabs} = sidebarProps;
  const {navigate, closeTab, openTabContextMenu} = sidebarProps;
  const {downloadCount, downloadProgress, downloadSublabel} = sidebarProps;
  const {downloadingGame} = sidebarProps;

  return <div>
    {map(items, (id, index) => {
      const data = tabData[id] || {};
      const {path} = data;
      let iconImage = data.iconImage;
      if (/^url/.test(path)) {
        iconImage = data.webFavicon;
      }
      
      const label = makeLabel(id, tabData);
      const icon = pathToIcon(path);
      const active = currentId === id;
      const onClick = () => { navigate(id); };
      const onClose = () => { closeTab({id}); };
      const onContextMenu = (e?: MouseEvent) => {
        openTabContextMenu({id});
      };
      let count = 0;
      let progress = 0;
      let sublabel: ILocalizedString = null;
      const loading = loadingTabs[id];

      if (id === "downloads") {
        count = downloadCount;
        progress = downloadProgress;
        sublabel = downloadSublabel;
      }

      let gameOverride: IGameRecord = null;
      if (id === "downloads") {
        gameOverride = downloadingGame;
      }

      const props = {id, path, label, icon, iconImage, active,
        onClick, count, progress, onClose, onContextMenu, data, t,
        sublabel, gameOverride, loading};
      return <SortableHubSidebarItem key={id} index={index} props={props}/>;
    })}
  </div>;
});

export function versionString () {
  return `itch v${appVersion}`;
}

@watching
export class HubSidebar extends React.Component<IProps & IDerivedProps & I18nProps, IState> {
  refs: {
    search: HTMLInputElement;
  };

  constructor (props: IProps & IDerivedProps & I18nProps) {
    super();
    this.state = {
      transient: props.tabs.transient,
    };

    this.triggerSearch = debounce(this.triggerSearch.bind(this), 100);
    this.onSearchKeyUp = this.onSearchKeyUp.bind(this);
    this.onSearchKeyDown = this.onSearchKeyDown.bind(this);
    this.onSearchChange = this.onSearchChange.bind(this);
    this.onSearchFocus = this.onSearchFocus.bind(this);
    this.onSearchBlur = debounce(this.onSearchBlur.bind(this), 200);
  }

  subscribe (watcher: Watcher) {
    watcher.on(actions.focusSearch, async (store, action) => {
      const {search} = this.refs;
      if (search) {
        search.focus();
        search.select();
      }
    });

    watcher.on(actions.closeSearch, async (store, action) => {
      const {search} = this.refs;
      if (search) {
        search.blur();
      }
    });

    watcher.on(actions.triggerBack, async (store, action) => {
      const {search} = this.refs;
      if (search) {
        search.blur();
      }
    });
  }

  render () {
    const {t, osx, sidebarWidth, fullscreen, id: currentId, tabs, tabData,
      navigate, closeAllTabs,
      newTab, searchLoading} = this.props;
    const classes = classNames("hub-sidebar", {osx, fullscreen});
    const sidebarStyle = {
      width: sidebarWidth + "px",
    };
    const searchClasses = classNames("search", {loading: searchLoading});

    const onSortEnd = (params: ISortEndParams) => {
      const {oldIndex, newIndex} = params;
      this.setState({
        transient: arrayMove(this.state.transient, oldIndex, newIndex),
      });
      this.props.moveTab({before: oldIndex, after: newIndex});
    };

    return <div className={classes} style={sidebarStyle}>
      <div className="title-bar-padder"/>

      <div className="logo" onClick={(e) => navigate("featured")} data-rh-at="bottom" data-rh={versionString()}>
        <img src={require("../static/images/logos/app-white.svg")}/>
      </div>

      <section className={searchClasses}>
        <input id="search" ref="search" type="search"
          placeholder={t("search.placeholder")}
          onKeyDown={this.onSearchKeyDown}
          onKeyUp={this.onSearchKeyUp}
          onChange={this.onSearchChange}
          onFocus={this.onSearchFocus}
          onBlur={this.onSearchBlur}>
        </input>
        <span className="icon icon-search"/>
      </section>

      <div className="sidebar-items">
        <h2>
          <span className="label">{t("sidebar.category.basics")}</span>
        </h2>
        {map(tabs.constant, (id, index) => {
          const data = tabData[id] || {};
          const {path} = data;
          const label = makeLabel(id, tabData);
          const icon = pathToIcon(path);
          const active = currentId === id;
          const onClick = () => navigate(id);
          const onContextMenu = () => {
            /* muffin */
          };
          const loading = false;

          const props = {id, path, label, icon, active, onClick, t, onContextMenu, loading, index};
          return <HubSidebarItem key={id} {...props}/>;
        })}

        <h2>
          <span className="label">{t("sidebar.category.tabs")}</span>
          <div className="filler"/>
          <span className="action"
              data-rh-at="top"
              data-rh={t("sidebar.close_all_tabs")}
              onClick={() => closeAllTabs({})}>
            <span className="icon icon-delete"/>
            <Ink/>
          </span>
          <span className="action"
              data-rh-at="top"
              data-rh={t("sidebar.new_tab")}
              onClick={() => newTab({})}>
            <span className="icon icon-plus"/>
            <Ink/>
          </span>
        </h2>

        <SortableList items={this.state.transient}
          sidebarProps={this.props}
          onSortEnd={onSortEnd}
          distance={5}
          lockAxis="y"
        />
      </div>

      <section className="sidebar-blank"/>

      <UserMenu/>
    </div>;
  }

  componentWillReceiveProps(props: IProps & IDerivedProps & I18nProps) {
    this.setState({
      transient: props.tabs.transient,
    });
  }

  onSearchFocus (e: React.FocusEvent<HTMLInputElement>) {
    this.props.focusSearch({});
  }

  onSearchBlur (e: React.FocusEvent<HTMLInputElement>) {
    this.props.closeSearch({});
  }

  onSearchChange (e: React.FormEvent<HTMLInputElement>) {
    this.triggerSearch();
  }

  onSearchKeyDown (e: React.KeyboardEvent<HTMLInputElement>) {
    const {key} = e;

    let passthrough = false;

    if (key === "Escape") {
      // default behavior is to clear - don't
    } else if (key === "ArrowDown") {
      this.props.searchHighlightOffset({offset: 1});
      // default behavior is to jump to end of input - don't
    } else if (key === "ArrowUp") {
      this.props.searchHighlightOffset({offset: -1});
      // default behavior is to jump to start of input - don't
    } else {
      passthrough = true;
    }

    if (!passthrough) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }
  }

  onSearchKeyUp (e: React.KeyboardEvent<HTMLInputElement>) {
    const {key} = e;

    if (key === "Escape") {
      return;
    } else if (key === "ArrowDown") {
      return;
    } else if (key === "ArrowUp") {
      return;
    } else if (key === "Enter") {
      return;
    }

    this.triggerSearch();
  }

  triggerSearch () {
    const search = this.refs.search;
    if (!search) {
      return;
    }

    this.props.search({query: search.value});
  }
}

interface IProps {}

interface IDerivedProps {
  osx: boolean;
  sidebarWidth: number;
  fullscreen: boolean;
  me: IUserRecord;

  id: string;
  path: string;
  tabs: {
    constant: string[];
    transient: string[];
  };
  tabData: ITabDataSet;
  loadingTabs: {
    [key: string]: boolean;
  };

  downloadCount: number;
  downloadProgress: number;  
  downloadSublabel: ILocalizedString;

  /** game that's currently downloading, if any */
  downloadingGame?: IGameRecord;

  /** true if we're currently fetching search results */
  searchLoading: boolean;
  navigate: typeof actions.navigate;
  closeTab: typeof actions.closeTab;
  closeAllTabs: typeof actions.closeAllTabs;
  moveTab: typeof actions.moveTab;

  viewCreatorProfile: typeof actions.viewCreatorProfile;
  viewCommunityProfile: typeof actions.viewCommunityProfile;
  changeUser: typeof actions.changeUser;
  openTabContextMenu: typeof actions.openTabContextMenu;
  newTab: typeof actions.newTab;
  copyToClipboard: typeof actions.copyToClipboard;

  focusSearch: typeof actions.focusSearch;
  closeSearch: typeof actions.closeSearch;
  search: typeof actions.search;
  searchHighlightOffset: typeof actions.searchHighlightOffset;

  reportIssue: typeof actions.reportIssue;
  openUrl: typeof actions.openUrl;
  checkForSelfUpdate: typeof actions.checkForSelfUpdate;

  quit: typeof actions.quit;
}

interface IState {
  transient: string[];
}

export default connect<IProps>(HubSidebar, {
  state: createStructuredSelector({
    osx: (state: IAppState) => state.system.osx,
    fullscreen: (state: IAppState) => state.ui.mainWindow.fullscreen,
    sidebarWidth: (state: IAppState) => state.preferences.sidebarWidth || 240,
    me: (state: IAppState) => state.session.credentials.me,
    id: (state: IAppState) => state.session.navigation.id,
    tabs: (state: IAppState) => state.session.navigation.tabs,
    tabData: (state: IAppState) => state.session.navigation.tabData,
    loadingTabs: (state: IAppState) => state.session.navigation.loadingTabs,
    searchLoading: (state: IAppState) => state.session.search.loading,

    downloadingGame: (state: IAppState) => {
      const { activeDownload } = state.downloads;
      if (activeDownload) {
        return activeDownload.game;
      }
    },

    downloadCount: createSelector(
      (state: IAppState) => state.downloads.finishedDownloads,
      (downloads) => downloads.length,
    ),

    downloadProgress: (state: IAppState) => state.downloads.progress,

    downloadSublabel: createSelector(
      (state: IAppState) => state.downloads.activeDownload,
      (state: IAppState) => state.downloads.downloadsPaused,
      (state: IAppState) => state.i18n.lang,
      (activeDownload, downloadsPaused, lang) => {
        if (!activeDownload) {
          return null;
        }

        if (downloadsPaused) {
          return ["grid.item.downloads_paused"];
        } else {
          const title = activeDownload.game.title;
          const duration = moment.duration(activeDownload.eta, "seconds") as any;
          // silly typings, durations have locales!
          const humanDuration = duration.locale(lang).humanize();
          return `${title} — ${humanDuration}`;
        }
      },
    ),
  }),
  dispatch: (dispatch) => ({
    navigate: dispatcher(dispatch, actions.navigate),
    closeTab: dispatcher(dispatch, actions.closeTab),
    closeAllTabs: dispatcher(dispatch, actions.closeAllTabs),
    moveTab: dispatcher(dispatch, actions.moveTab),

    viewCreatorProfile: dispatcher(dispatch, actions.viewCreatorProfile),
    viewCommunityProfile: dispatcher(dispatch, actions.viewCommunityProfile),
    changeUser: dispatcher(dispatch, actions.changeUser),
    openTabContextMenu: dispatcher(dispatch, actions.openTabContextMenu),
    newTab: dispatcher(dispatch, actions.newTab),
    copyToClipboard: dispatcher(dispatch, actions.copyToClipboard),

    focusSearch: dispatcher(dispatch, actions.focusSearch),
    closeSearch: dispatcher(dispatch, actions.closeSearch),
    search: dispatcher(dispatch, actions.search),
    searchHighlightOffset: dispatcher(dispatch, actions.searchHighlightOffset),

    reportIssue: dispatcher(dispatch, actions.reportIssue),
    openUrl: dispatcher(dispatch, actions.openUrl),
    checkForSelfUpdate: dispatcher(dispatch, actions.checkForSelfUpdate),

    quit: dispatcher(dispatch, actions.quit),
  }),
});
