import { Store } from "redux";
import { Action } from "redux-actions";

// shared with node-buse
import { Game, User, OwnUser, Upload } from "ts-itchio-api";

import { ICollection } from "../db/models/collection";
import { IDownloadKey, IDownloadKeySummary } from "../db/models/download-key";
import { ICaveSummary, ICave } from "../db/models/cave";

export * from "./tasks";
export * from "./errors";
import * as Tasks from "./tasks";

export * from "./api";
export * from "./tab-data";
import * as TabDataTypes from "./tab-data";
export * from "../os/runtime";

import { SortDirection, SortKey } from "../components/sort-types";

export interface IStore extends Store<IRootState> {}

interface IWatcher {
  addSub(sub: IWatcher): void;
  removeSub(sub: IWatcher): void;
}

export interface IChromeStore extends IStore {
  watcher: IWatcher;
}

export interface IDispatch {
  (a: Action<any>): void;
}

export type Partial<T> = { [P in keyof T]?: T[P] };

export type GenerosityLevel = "discreet";

export type LaunchType = "native" | "html" | "external" | "shell";

export type ClassificationAction = "launch" | "open";

export interface IUserSet {
  [id: string]: User;
}

export interface IInstallLocationRecord {
  /** UUID or 'default' */
  id: string;

  /** path on disk, null for 'default' (since it's computed) */
  path?: string;
}

export interface ITabParamsSet {
  [key: string]: ITabParams;
}

export interface ITabParams {
  sortBy?: SortKey;
  sortDirection?: SortDirection;
}

export interface ITabPaginationSet {
  [key: string]: ITabPagination;
}

export interface ITabPagination {
  offset?: number;
  limit?: number;
}

export interface IGameSet {
  [id: string]: Game;
}

export interface IDownloadKeySet {
  [id: string]: IDownloadKey;
}

export interface ICollectionSet {
  [id: string]: ICollection;
}

export interface ICaveSet {
  [key: string]: ICave;
}

export type InstallerType =
  | "archive"
  | "air"
  | "dmg"
  | "inno"
  | "nsis"
  | "msi"
  | "naked"
  | "unknown";

export type TableName =
  | "caves"
  | "users"
  | "games"
  | "collections"
  | "downloadKeys"
  | "itchAppTabs";

export interface IEntityMap<T> {
  [entityId: string]: T;
}

export interface ITableMap {
  [table: string]: IEntityMap<any>;
  games?: IEntityMap<Partial<Game>>;
  users?: IEntityMap<Partial<User>>;
  collections?: IEntityMap<Partial<ICollection>>;
}

/**
 * Refers to a bunch of records, for example:
 * { 'apples': ['gala', 'cripps', 'golden'], 'pears': ['anjou'] }
 */
export interface IEntityRefs {
  [table: string]: string[];
}

/**
 * Specifies what to delete from the DB
 */
export interface IDBDeleteSpec {
  entities: IEntityRefs;
}

// see https://itch.io/docs/itch/integrating/manifest.html
export interface IManifestAction {
  /** human-readable or standard name */
  name: string;

  /** file path (relative to manifest), URL, etc. */
  path: string;

  /** icon name (see static/fonts/icomoon/demo.html, don't include `icon-` prefix) */
  icon: string;

  /** command-line arguments */
  args: string[];

  /** sandbox opt-in */
  sandbox?: boolean;

  /** requested API scope */
  scope?: string;

  /** don't redirect stdout/stderr, open in new console window */
  console?: boolean;
}

export interface IManifestPrereq {
  name: string;
}

export interface IManifest {
  actions: IManifestAction[];
  prereqs: IManifestPrereq[];
}

export interface ICredentials {
  key: string;
  me: OwnUser;
}

/**
 * The entire application state, following the redux philosophy
 */
export interface IRootState {
  modals: IModalsState;
  system: ISystemState;
  setup: ISetupState;
  rememberedSessions: IRememberedSessionsState;
  session: ISessionState;
  i18n: II18nState;
  ui: IUIState;
  selfUpdate: ISelfUpdateState;
  preferences: IPreferencesState;
  tasks: ITasksState;
  downloads: IDownloadsState;
  status: IStatusState;
  gameUpdates: IGameUpdatesState;
  queries: IQueriesState;
  /** commonly-needed subset of DB rows available in a compact & performance-friendly format */
  commons: ICommonsState;
  systemTasks: ISystemTasksState;
}

export interface IQueriesState {
  [key: string]: {
    [key: string]: any[];
  };

  cavesByGameId: {
    [gameId: string]: ICave[];
  };

  downloadKeysByGameId: {
    [gameId: string]: IDownloadKey[];
  };
}

export interface ICommonsState {
  downloadKeys: {
    [downloadKeyId: string]: IDownloadKeySummary;
  };
  downloadKeyIdsByGameId: {
    [gameId: string]: string[];
  };

  caves: {
    [caveId: string]: ICaveSummary;
  };
  caveIdsByGameId: {
    [gameId: string]: string[];
  };

  /** games we can edit or have keys for */
  libraryGameIds: number[];
  myGameIdsSet: {
    [gameId: string]: boolean;
  };

  /** size on disk (in bytes) of each install location */
  locationSizes: {
    [id: string]: number;
  };
}

export interface IGameCredentials {
  apiKey: string;
  downloadKey?: IDownloadKey;
}

export interface IGameUpdate {
  /** which game an update is available for */
  game: Game;

  /**
   * uploads to pick from (fresher than our last install).
   * will hopefully be often of size 1, but not always
   */
  recentUploads: Upload[];

  /** true if wharf-enabled upgrade via butler */
  incremental?: boolean;

  /** list of patch entries needed to upgrade to latest via butler */
  upgradePath?: IUpgradePathItem[];
}

export interface IGameUpdatesState {
  /** pending game updates */
  updates: {
    [caveId: string]: IGameUpdate;
  };
}

export type IModalAction = Action<any> | Action<any>[];

export type ModalButtonActionSource = "widget";

export interface IModalButton {
  /** HTML id for this button */
  id?: string;

  /** icomoon icon to use for button */
  icon?: string;

  /** text to show on button */
  label: ILocalizedString;

  /** whether this button directly specifies an action or if it's taken from the widget */
  actionSource?: ModalButtonActionSource;

  /** what should happen when clicking the button */
  action: IModalAction;

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

export function isModalButton(object: any): object is IModalButton {
  return "label" in object;
}

// FIXME: that's naughty - just make static buttons be constants instead, that works.
export type IModalButtonSpec = IModalButton | "ok" | "cancel" | "nevermind";

export interface IModal {
  /** generated identifier for this modal */
  id?: string;

  /** title of the modal */
  title: ILocalizedString;

  /** main body of text */
  message: ILocalizedString;

  /** secondary body of text */
  detail?: ILocalizedString;

  /** an image to show prominently in the modal */
  stillCoverUrl?: string;
  coverUrl?: string;

  /** main buttons (in list format) */
  bigButtons?: IModalButtonSpec[];

  /** secondary buttons */
  buttons?: IModalButtonSpec[];

  /** name of a custom React component to render below message */
  widget?: string;

  /** parameters to pass to React component */
  widgetParams?: any;

  unclosable?: boolean;
}

export type IModalsState = IModal[];

export interface IItchAppProfile {
  [id: string]: any;
  myGames: IItchAppProfileMyGames;
}

export interface IItchAppProfileMyGames {
  ids: string[];
}

export interface IItchAppTabs {
  /** id of current tab at time of snapshot */
  current: string;

  /** list of transient tabs when the snapshot was taken */
  items: TabDataTypes.ITabDataSave[];
}

export interface IDownloadKeysMap {
  [id: string]: IDownloadKey;
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
  platform: string;

  /** true if running on macOS */
  osx: boolean;
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

  /** total/free space in various partitions/disks */
  diskInfo: IPartsInfo;

  /** if non-null, the proxy specified by the OS (as sniffed by Chromium) */
  proxy?: string;

  /** if non-null, where the proxy settings come from */
  proxySource?: ProxySource;

  /** true if we're done booting */
  booted?: boolean;

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
}

export interface ISetupState {
  done: boolean;
  errors: string[];
  blockingOperation: ISetupOperation;
}

export interface IRememberedSession {
  /** API key */
  key: string;

  /** user info */
  me: OwnUser;

  /** date the user was last active in the app (this install) */
  lastConnected: number;
}

export interface IRememberedSessionsState {
  [id: string]: IRememberedSession;
}

export interface ISessionState {
  /** collection freshness information */
  cachedCollections: ISessionCachedCollectionsState;
  credentials: ISessionCredentialsState;
  folders: ISessionFoldersState;
  login: ISessionLoginState;
  navigation: ISessionNavigationState;
  search: ISessionSearchState;

  tabData: TabDataTypes.ITabDataSet;
  tabParams: ITabParamsSet;
  tabPagination: ITabPaginationSet;
}

export interface ISessionCachedCollectionsState {
  /** maps collections to the date they were last fetched */
  fetched: {
    [collectionId: number]: number;
  };
}

export interface ISessionCredentialsState {
  /** API key */
  key: string;

  /** info on user using the app */
  me: OwnUser;
}

export interface ISessionFoldersState {
  /** path where user-specific data is stored, such as their credentials */
  libraryDir: string;
}

export interface ISessionLoginState {
  /**
   * true if the list of remembered sessions is shown,
   * false if the username/password form is shown.
   */
  picking: boolean;

  errors: string[];
  blockingOperation: ISetupOperation;
}

export interface ITabs {
  /** tabs that can't be closed or re-ordered */
  constant: string[];
  /** tabs that can be moved around/closed */
  transient: string[];
}

export type TabLayout = "grid" | "table";

export interface ISessionNavigationState {
  /** opened tabs */
  tabs: ITabs;

  /** set to true when a tab is loading */
  loadingTabs: {
    [key: string]: boolean;
  };

  /** current page (gate, etc.) */
  page: string;

  /** current tab id */
  tab: string;

  /** last constant tab visited */
  lastConstant: string;
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

export interface ISessionSearchState {
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
  [lang: string]: {
    [key: string]: string;
  };
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

export interface IInstallLocation {
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
}

export interface ITask {
  /** generated identifier */
  id: string;

  /** name of the task: install, uninstall, etc. */
  name: Tasks.TaskName;

  /** progress in the [0, 1] interval */
  progress: number;

  /** id of the game this task is for (which game we're installing, etc.) */
  gameId: number;

  /** bytes per second at which task is being processed, if applicable */
  bps?: number;

  /** estimated time remaining for task, in seconds, if available */
  eta?: number;

  prereqsState?: IPrereqsState;
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

export interface IEnvironment {
  [key: string]: string;
}

export interface IUpgradePathItem {
  id: number;
  userVersion?: string;
  updatedAt: string;
  patchSize: number;
}

/**
 * A download in progress for the app. Always linked to a game,
 * sometimes for first install, sometimes for update.
 */
export interface IDownloadItem extends Tasks.IQueueDownloadOpts {
  /** unique generated id for this download */
  id: string;

  /** reason why this download was started */
  reason: Tasks.DownloadReason;

  /** download progress in a [0, 1] interval */
  progress: number;

  /** set when download has been completed */
  finished?: boolean;

  /** order in the download list: can be negative, for reordering */
  order: number;

  /** at how many bytes per second are we downloading right now? */
  bps?: number;

  /** how many seconds till the download ends? */
  eta?: number;

  /** timestamp the download started at */
  startedAt?: number;

  /** timestamp the download finished at */
  finishedAt?: number;

  /** an error that may have occured while downloading */
  err?: string;

  /** stack trace of an error that may have occured while downloading */
  errStack?: string;
}

export type DownloadSpeedDataPoint = number;

export type IDownloadSpeeds = DownloadSpeedDataPoint[];

export interface IDownloadsState {
  /** All the downloads we know about, indexed by their own id */
  items: {
    [id: string]: IDownloadItem;
  };

  /** IDs of all the downloads we know about, grouped by the id of the game they're associated to */
  itemIdsByGameId: {
    [gameId: string]: string[];
  };

  /** true if downloads are currently paused */
  paused: boolean;

  /** Download speeds, in bps, each item represents one second */
  speeds: IDownloadSpeeds;
}

export type OpenAtLoginErrorCause = "no_desktop_file" | "error";

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

// diskinfo

export interface ISpaceInfo {
  free: number;
  size: number;
}

export interface IPartInfo extends ISpaceInfo {
  letter?: string;
  mountpoint?: string;
}

/**
 * Contains information about the size and free space
 * of all the partitions / disks of this computer.
 */
export interface IPartsInfo {
  parts: IPartInfo[];
  total: ISpaceInfo;
}

export interface IProgressInfo {
  /** progress of the task between [0,1] */
  progress: number;

  /** current bytes per second */
  bps?: number;

  /** estimated time remaining, in seconds */
  eta?: number;

  prereqsState?: IPrereqsState;
}

export interface IProgressListener {
  (info: IProgressInfo): void;
}

export interface IPrereqsState {
  tasks: {
    [prereqName: string]: ITaskProgressState;
  };
}

export interface ITaskProgressState {
  name: string;
  order: number;
  status: TaskProgressStatus;
  progress: number;
  eta: number;
  bps: number;
  prereqsState?: IPrereqsState;
}

export type TaskProgressStatus =
  | "downloading"
  | "extracting"
  | "ready"
  | "installing"
  | "done";

export interface IRedistInfo {
  /** Human-friendly name for redist, e.g. "Microsoft Visual C++ 2010 Redistributable" */
  fullName: string;

  /** The exact version provided */
  version: string;

  /** Architecture of the redist */
  arch: "386" | "amd64";

  /** Executable to launch (in .7z archive) */
  command: string;

  /** Arguments to give to executable on launch - aim for quiet/unattended/no reboots */
  args: string[];

  /** Should the executable be run as admin? */
  elevate?: boolean;

  /** Registry keys we can check to see if installed */
  registryKeys?: string[];

  /** List of DLLs to check for, to make sure it's installed */
  dlls?: string[];

  /** Meaning of some exit codes */
  exitCodes?: IRedistExitCode[];
}

export interface IRedistExitCode {
  code: number;
  success?: boolean;
  message?: string;
}

export type ExeArch = "386" | "amd64";

export type ItchPlatform = "osx" | "windows" | "linux" | "unknown";

export interface IRuntime {
  platform: ItchPlatform;
  is64: boolean;
}

export interface IMenuItem extends Electron.MenuItemConstructorOptions {
  localizedLabel?: ILocalizedString;
  action?: Action<any>;
  submenu?: IMenuItem[];
  id?: string;
}
export type IMenuTemplate = IMenuItem[];
