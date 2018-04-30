import { Store } from "redux";

export * from "./errors";
export * from "./net";
export * from "./tab-data";
import * as TabDataTypes from "./tab-data";

export * from "./sort-types";
import { SortKey, SortDirection } from "./sort-types";

import { modalWidgets } from "renderer/components/modal-widgets/index";
import { ITabData } from "./tab-data";
import {
  GameUpdate,
  Game,
  User,
  Collection,
  CaveSummary,
  DownloadKeySummary,
  Download,
  DownloadProgress,
  Platform,
} from "common/butlerd/messages";
import { IEndpoint } from "butlerd";
export interface IStore extends Store<IRootState> {}

export interface IDispatch {
  (action: IAction<any>): void;
}

export interface IAction<T extends Object> {
  type: string;
  payload?: T;
}

interface IWatcher {
  addSub(sub: IWatcher): void;
  removeSub(sub: IWatcher): void;
}

export interface IChromeStore extends IStore {
  watcher: IWatcher;
}

export interface IDispatch {
  (a: IAction<any>): void;
}

export type GenerosityLevel = "discreet";

export type ClassificationAction = "launch" | "open";

export interface IUserSet {
  [id: string]: User;
}

export interface ITabParams {
  sortBy?: SortKey;
  sortDirection?: SortDirection;
}

export interface IGameSet {
  [id: string]: Game;
}

export interface ICollectionSet {
  [id: string]: Collection;
}

export interface ICredentials {
  me: User;
}

/**
 * The entire application state, following the redux philosophy
 */
export interface IRootState {
  modals: IModalsState;
  system: ISystemState;
  setup: ISetupState;
  profile: IProfileState;
  i18n: II18nState;
  ui: IUIState;
  selfUpdate: ISelfUpdateState;
  preferences: IPreferencesState;
  tasks: ITasksState;
  downloads: IDownloadsState;
  status: IStatusState;
  gameUpdates: IGameUpdatesState;

  /** commonly-needed subset of DB rows available in a compact & performance-friendly format */
  commons: ICommonsState;

  systemTasks: ISystemTasksState;
  broth: IBrothState;
  butlerd: IButlerdState;
}

export interface IBrothState {
  packages: {
    [key: string]: IPackageState;
  };
}

export interface IButlerdState {
  endpoint?: IEndpoint;
}

export interface IPackageState {
  stage: "assess" | "download" | "install" | "idle";
  version?: string;
  versionPrefix?: string;
  progressInfo?: IProgressInfo;
}

export interface ICommonsState {
  downloadKeys: {
    [downloadKeyId: string]: DownloadKeySummary;
  };
  downloadKeyIdsByGameId: {
    [gameId: string]: string[];
  };

  caves: {
    [caveId: string]: CaveSummary;
  };
  caveIdsByGameId: {
    [gameId: string]: string[];
  };

  /** size on disk (in bytes) of each install location */
  locationSizes: {
    [id: string]: number;
  };
}

export interface IGameUpdatesState {
  /** pending game updates */
  updates: {
    [caveId: string]: GameUpdate;
  };

  /** are we currently checking? */
  checking: boolean;

  /** check progress */
  progress: number;
}

export type IModalAction = IAction<any> | IAction<any>[];

export interface IModalButton {
  /** HTML id for this button */
  id?: string;

  /** icomoon icon to use for button */
  icon?: string;

  /** text to show on button */
  label: ILocalizedString;

  /** what should happen when clicking the button */
  action?: IModalAction | "widgetResponse";

  /** use this to specify custom CSS classes (which is both naughty and nice) */
  className?: string;

  /** Tags to tack after label */
  tags?: IModalButtonTag[];

  timeAgo?: {
    date: Date;
  };
}

export interface IModalButtonTag {
  label?: ILocalizedString;
  icon?: string;
}

// FIXME: that's naughty - just make static buttons be constants instead, that works.
export type IModalButtonSpec = IModalButton | "ok" | "cancel" | "nevermind";

export interface IModalBase {
  /** generated identifier for this modal */
  id?: string;

  /** title of the modal */
  title: ILocalizedString;

  /** main body of text */
  message?: ILocalizedString;

  /** secondary body of text */
  detail?: ILocalizedString;

  /** an image to show prominently in the modal */
  stillCoverUrl?: string;
  coverUrl?: string;

  /** main buttons (in list format) */
  bigButtons?: IModalButtonSpec[];

  /** secondary buttons */
  buttons?: IModalButtonSpec[];

  unclosable?: boolean;
  fullscreen?: boolean;
}

export interface IModal extends IModalBase {
  /** name of modal widget to render */
  widget?: keyof typeof modalWidgets;

  /** parameters to pass to React component */
  widgetParams?: {};
}

export interface IModalUpdate {
  /** the modal's unique identifier */
  id: string;

  /** the parameters for the widget being shown in the modal */
  widgetParams: any;
}

export type IModalsState = IModal[];

export interface IItchAppTabs {
  /** id of current tab at time of snapshot */
  current: string;

  /** list of transient tabs when the snapshot was taken */
  items: TabDataTypes.ITabDataSave[];
}

export type ProxySource = "os" | "env";

export interface IProxySettings {
  /** if non-null, the proxy specified by the OS (as sniffed by Chromium) */
  proxy?: string;

  /** if non-null, where the proxy settings come from */
  proxySource?: ProxySource;
}

export interface ISystemState {
  /** version string, for example '25.0.0' */
  appVersion: string;

  /** the platform string, in itch format */
  platform: Platform;

  /** 'ia32' or 'x64' */
  arch: string;

  /** true if running on macOS */
  macos: boolean;

  /** true if running on Windows */
  windows: boolean;

  /** true if running on GNU/Linux */
  linux: boolean;

  /** 2-letter language code sniffed from user's OS */
  sniffedLanguage?: string;

  /** path of ~ */
  homePath: string;

  /** ~/.config/itch, ~/Library/Application Data/itch, %APPDATA%/itch */
  userDataPath: string;

  /** if non-null, the proxy specified by the OS (as sniffed by Chromium) */
  proxy?: string;

  /** if non-null, where the proxy settings come from */
  proxySource?: ProxySource;

  /** true if we're about to quit */
  quitting?: boolean;
}

export interface ISystemTasksState {
  /** timestamp for next self update check (milliseconds since epoch) */
  nextSelfUpdateCheck: number;

  /** timestamp for next game update check (milliseconds since epoch) */
  nextGameUpdateCheck: number;
}

export interface ISetupOperation {
  message: ILocalizedString;
  icon: string;
  stack?: string;
  stage?: string;
  progressInfo?: IProgressInfo;
}

export interface ISetupState {
  done: boolean;
  errors: string[];
  blockingOperation: ISetupOperation;
}

export interface IProfileState {
  /** collection freshness information */
  credentials: IProfileCredentialsState;
  login: IProfileLoginState;
  navigation: IProfileNavigationState;
  search: IProfileSearchState;

  tabInstances: TabDataTypes.ITabInstances;
  itchioUris: string[];
}

// TODO: remove, just put the butlerd profile object in the state
export interface IProfileCredentialsState {
  /** info on user using the app */
  me: User;
}

export interface IProfileLoginState {
  error?: Error;
  blockingOperation: ISetupOperation;
  lastUsername?: string;
}

export interface IOpenTabs {
  /** tabs that can't be closed or re-ordered */
  constant: string[];
  /** tabs that can be moved around/closed */
  transient: string[];
}

export type TabLayout = "grid" | "table";

export interface IProfileNavigationState {
  /** opened tabs */
  openTabs: IOpenTabs;

  /** set to true when a tab is loading */
  loadingTabs: ILoadingTabs;

  /** current page (gate, etc.) */
  page: string;

  /** current tab id */
  tab: string;

  /** last constant tab visited */
  lastConstant: string;
}

export interface ILoadingTabs {
  [key: string]: boolean;
}

export interface ISearchResults {
  games?: {
    ids: number[];
    set: IGameSet;
  };

  users?: {
    ids: number[];
    set: IUserSet;
  };
}

export interface IProfileSearchState {
  /** search suggestion */
  example: string;

  /** query typed by user */
  typedQuery: string;

  /** query we're showing results for (lags behind typedQuery) */
  query: string;

  /** whether the search pane is displayed or not */
  open: boolean;

  /** whether we're currently fetching results or not */
  loading: boolean;

  /** search result currently highlighted */
  highlight: number;

  /** current search results for 'query' */
  results: ISearchResults;
}

export interface II18nResources {
  [lang: string]: II18nKeys;
}

export interface II18nKeys {
  [key: string]: string;
}

/** Info about a locale. See locales.json for a list that ships with the app. */
export interface ILocaleInfo {
  /** 2-letter language code */
  value: string;

  /** native name of language (English, Français, etc.) */
  label: string;
}

export interface II18nState {
  /** 2-letter code for the language the app is currently displayed in */
  lang: string;

  /** all translated strings */
  strings: II18nResources;

  /** locales we'll download soon */
  queued: {
    [lang: string]: boolean;
  };

  /** locales we're downloading now */
  downloading: {
    [lang: string]: boolean;
  };

  locales: ILocaleInfo[];
}

export interface IUIMenuState {
  template: IMenuTemplate;
}

export interface IUIMainWindowState {
  /** id of the electron BrowserWindow the main window is displayed in */
  id: number;

  /** true if main window has focus */
  focused: boolean;

  /** true if main window is fullscreen */
  fullscreen: boolean;

  /** true if main window is maximized */
  maximized: boolean;
}

export interface IUIContextMenuState {
  open: boolean;
  data: {
    template: IMenuTemplate;
    clientX: number;
    clientY: number;
  };
}

export interface IUIState {
  menu: IUIMenuState;
  mainWindow: IUIMainWindowState;
  contextMenu: IUIContextMenuState;
}

export interface ISelfUpdate {
  /** the name of the version, e.g. 19.0.0 */
  name: string;

  /** the date the version was published at */
  pub_date: string;

  /** release notes for the version */
  notes: string;

  /** release page for this version */
  url: string;
}

export interface ISelfUpdateState {
  available?: ISelfUpdate;
  downloading?: ISelfUpdate;
  downloaded?: ISelfUpdate;

  checking: boolean;
  uptodate: boolean;
  error?: string;
}

interface IInstallLocation {
  /** path on disk (empty for appdata) */
  path: string;

  /** set to true when deleted. still keeping the record around in case some caves still exist with it */
  deleted?: boolean;
}

export interface IPreferencesState {
  /** is the app allowed to check for updates to itself? */
  downloadSelfUpdates?: boolean;

  /** do not make any network requests */
  offlineMode?: boolean;

  installLocations?: {
    [key: string]: IInstallLocation;
  };

  /** where to install games (doesn't change already-installed games) */
  defaultInstallLocation?: string;

  sidebarWidth?: number;

  /** use sandbox */
  isolateApps?: boolean;

  /** when closing window, keep running in tray */
  closeToTray?: boolean;

  /** notify when a download has been installed or updated */
  readyNotification?: boolean;

  /** show the advanced section of settings */
  showAdvanced?: boolean;

  /** language picked by the user */
  lang?: string;

  /** if true, user's already seen the 'minimize to tray' notification */
  gotMinimizeNotification?: boolean;

  /** should the itch app start on os startup? */
  openAtLogin?: boolean;

  /** when the itch app starts at login, should it be hidden? */
  openAsHidden?: boolean;

  /** show consent dialog before applying any game updates */
  manualGameUpdates?: boolean;

  /** prevent display sleep while playing */
  preventDisplaySleep?: boolean;

  /** if rediff'd patch is available, use it instead of original patch */
  preferOptimizedPatches?: boolean;

  /** hide games that aren't compatible with this computer (in native views) */
  onlyCompatibleGames?: boolean;

  /** hide games that weren't purchased or claimed */
  onlyOwnedGames?: boolean;

  /** hide games that aren't currently installed */
  onlyInstalledGames?: boolean;

  /** layout to use to show games */
  layout?: TabLayout;

  /** disable all webviews */
  disableBrowser?: boolean;

  /** disable GPU acceleration, see #809 */
  disableHardwareAcceleration?: boolean;
}

export interface ITask {
  /** generated identifier */
  id: string;

  /** name of the task: install, uninstall, etc. */
  name: TaskName;

  /** progress in the [0, 1] interval */
  progress: number;

  /** id of the game this task is for (which game we're installing, etc.) */
  gameId: number;

  /** bytes per second at which task is being processed, if applicable */
  bps?: number;

  /** estimated time remaining for task, in seconds, if available */
  eta?: number;

  stage?: string;
}

export interface ITasksState {
  /** all tasks currently going on in the app (installs, uninstalls, etc.) */
  tasks: {
    [key: string]: ITask;
  };

  /** same as tasks, grouped by gameId - there may be multiple for the same game */
  tasksByGameId: {
    [gameId: string]: ITask[];
  };

  /** all tasks finished and not cleared yet, since the app started */
  finishedTasks: ITask[];
}

export interface IDownloadsState {
  /** All the downloads we know about, indexed by their own id */
  items: {
    [id: string]: Download;
  };

  /** IDs of all the downloads we know about, grouped by the id of the game they're associated to */
  itemIdsByGameId: {
    [gameId: string]: string[];
  };

  progresses: {
    [id: string]: DownloadProgress;
  };

  /** true if downloads are currently paused */
  paused: boolean;

  /** Download speeds, in bps, each item represents one second */
  speeds: number[];
}

type OpenAtLoginErrorCause = "no_desktop_file" | "error";

/**
 * Something went wrong when applying
 */
export interface IOpenAtLoginError {
  /** why did applying the setting failed */
  cause: OpenAtLoginErrorCause;

  /** if cause is `error`, this is an error message */
  message?: string;
}

export interface IStatusState {
  messages: ILocalizedString[];
  openAtLoginError: IOpenAtLoginError;
  reduxLoggingEnabled: boolean;
}

// i18n

/**
 * Localized messages can be just a string, or an Array arranged like so:
 * [key: string, params: {[name: string]: string}]
 */
export type ILocalizedString = string | any[];

export interface IProgressInfo {
  /** progress of the task between [0,1] */
  progress: number;

  /** current bytes per second */
  bps?: number;

  /** estimated time remaining, in seconds */
  eta?: number;

  stage?: string;

  doneBytes?: number;
  totalBytes?: number;
}

export interface IProgressListener {
  (info: IProgressInfo): void;
}

export interface IRuntime {
  platform: Platform;
}

export interface IMenuItem extends Electron.MenuItemConstructorOptions {
  localizedLabel?: ILocalizedString;
  action?: IAction<any>;
  submenu?: IMenuItem[];
  id?: string;
}
export type IMenuTemplate = IMenuItem[];

export interface INavigatePayload {
  /** the url to navigate to */
  url: string;

  /** if we know this associates with a resource, let it be known here */
  resource?: string;

  /** if we already have tab data, let it be here */
  data?: TabDataTypes.ITabData;

  /** whether to open a new tab in the background */
  background?: boolean;
}

export interface IOpenTabPayload extends INavigatePayload {
  /** the id of the new tab to open (generated) */
  tab?: string;
}

export interface IOpenContextMenuBase {
  /** left coordinate, in pixels */
  clientX: number;

  /** top coordinate, in pixels */
  clientY: number;
}

export interface ModalResponse {
  // FIXME: this is messy

  /** recaptcha challenge response */
  recaptchaResponse?: string;
}

interface IEvolveBasePayload {
  /** the tab to evolve */
  tab: string;

  /** the new URL */
  url: string;

  /** the new resource if any */
  resource?: string;

  /** new tab data to add to the previous set */
  data?: ITabData;
}

export interface IEvolveTabPayload extends IEvolveBasePayload {
  /** if false, that's a new history entry, if true it replaces the current one */
  replace: boolean;

  /** if true, it doesn't warrant a remote fetch */
  onlyParamsChange?: boolean;
}

export interface INavigateTabPayload extends IEvolveBasePayload {
  /** whether to open in the background */
  background: boolean;
}

export type TaskName =
  | "install-queue"
  | "install"
  | "uninstall"
  | "configure"
  | "launch";

export type AutoUpdaterStart = () => Promise<boolean>;
