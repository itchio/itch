import {
  Dispatch,
  Action,
  SystemTasksState,
  ProxySource,
  CommonsState,
  ModalAction,
  ItchAppTabs,
  MenuTemplate,
  I18nResources,
  I18nKeys,
  ProgressInfo,
  IOpenTabPayload,
  GenerosityLevel,
  SearchResults,
  PreferencesState,
  IOpenAtLoginError,
  LocalizedString,
  IOpenContextMenuBase,
  ModalResponse,
  TabData,
  INavigatePayload,
  IEvolveTabPayload,
  INavigateTabPayload,
  TaskName,
  PackageState,
  SystemState,
  ItchWindowRole,
} from "../types/index";

import {
  Game,
  Upload,
  CleanDownloadsEntry,
  GameUpdate,
  Profile,
  Download,
  DownloadProgress,
  Cave,
} from "common/butlerd/messages";
import { IEndpoint } from "butlerd";
import { TypedModal, TypedModalUpdate } from "renderer/modal-widgets";
export interface ActionCreator<PayloadType> {
  payload: PayloadType;
  (payload: PayloadType): Action<PayloadType>;
}

function action<PayloadType>(): ActionCreator<PayloadType> {
  const ret = (type: string) => (payload: PayloadType): Action<PayloadType> => {
    return {
      type,
      payload,
    };
  };
  // bending typing rules a bit, forgive me
  return ret as any;
}

export function dispatcher<T, U>(
  dispatch: Dispatch,
  actionCreator: (payload: T) => Action<U>
) {
  return (payload: T) => {
    const action = actionCreator(payload);
    dispatch(action);
    return action;
  };
}

interface MirrorInput {
  [key: string]: ActionCreator<any>;
}

type MirrorOutput<T> = { [key in keyof T]: T[key] };

function wireActions<T extends MirrorInput>(input: T): MirrorOutput<T> {
  const res: MirrorOutput<T> = {} as any;
  for (const k of Object.keys(input)) {
    res[k] = input[k](k) as any;
  }
  return res;
}

export const actions = wireActions({
  // system

  preboot: action<{}>(),
  boot: action<{}>(),
  tick: action<{}>(),
  scheduleSystemTask: action<Partial<SystemTasksState>>(),
  systemAssessed: action<{
    system: SystemState;
  }>(),
  languageChanged: action<{
    lang: string;
  }>(),
  processUrlArguments: action<{
    /** these are command-line arguments */
    args: string[];
  }>(),
  handleItchioURI: action<{
    /** example: itchio:///games/3 */
    uri: string;
  }>(),
  pushItchioURI: action<{
    uri: string;
  }>(),
  clearItchioURIs: action<{}>(),

  proxySettingsDetected: action<{
    /** a valid HTTP(S) proxy string (that could be in $HTTP_PROXY) */
    proxy: string;
    source: ProxySource;
  }>(),
  commonsUpdated: action<Partial<CommonsState>>(),

  // modals

  openModal: action<TypedModal<any, any>>(),
  updateModalWidgetParams: action<TypedModalUpdate<any>>(),
  closeModal: action<{
    window: string;

    /** id of the modal to close - if unspecified, close frontmost */
    id?: string;

    /** action that should be dispatched once the modal's been closed */
    action?: ModalAction;
  }>(),
  modalClosed: action<{
    window: string;

    /** id of the modal that was just closed */
    id: string;

    /** if there was a response, it's here */
    response: ModalResponse | null;
  }>(),
  modalResponse: action<any>(),

  openWindow: action<{
    initialURL: string;
    role: ItchWindowRole;
    preload?: boolean;
  }>(),
  windowClosed: action<{
    window: string;
  }>(),
  windowOpened: action<{
    window: string;
    nativeId: number;
    initialURL: string;
    role: ItchWindowRole;
    preload?: boolean;
  }>(),
  windowAwakened: action<{
    window: string;
    initialURL: string;
  }>(),
  windowLulled: action<{
    window: string;
  }>(),

  // setup

  packagesListed: action<{
    packageNames: string[];
  }>(),
  packageGotVersionPrefix: action<{
    name: string;
    version: string;
    versionPrefix: string;
  }>(),
  packageStage: action<{
    name: string;
    stage: PackageState["stage"];
  }>(),
  packageNeedRestart: action<{
    name: string;
    availableVersion: string;
  }>(),
  packageProgress: action<{
    name: string;
    progressInfo: ProgressInfo;
  }>(),

  relaunchRequest: action<{}>(),
  relaunch: action<{}>(),

  gotButlerdEndpoint: action<{
    endpoint: IEndpoint;
  }>(),

  setupStatus: action<{
    icon: string;
    message: LocalizedString;
    stack?: string;
  }>(),
  setupOperationProgress: action<{
    progress: ProgressInfo;
  }>(),
  setupDone: action<{}>(),
  retrySetup: action<{}>(),

  // login

  attemptLogin: action<{}>(),
  loginWithPassword: action<{
    /** the username or e-mail for the itch.io account to log in as */
    username: string;

    /** the password for the itch.io account to log in as */
    password: string;

    /** the 2FA totp code entered by user */
    totpCode?: string;
  }>(),
  useSavedLogin: action<{
    profile: Profile;
  }>(),
  loginFailed: action<{
    /** the username we couldn't log in as (useful to prefill login form for retry) */
    username: string;

    /** an error that occured while logging in */
    error: Error;
  }>(),
  loginCancelled: action<{}>(),
  loginSucceeded: action<{
    /** Profile we just logged in as */
    profile: Profile;
  }>(),

  forgetProfileRequest: action<{
    /** Profile to forget */
    profile: Profile;
  }>(),
  forgetProfile: action<{
    /** Profile to forget */
    profile: Profile;
  }>(),
  profilesUpdated: action<{}>(),

  changeUser: action<{}>(),
  requestLogout: action<{}>(),
  logout: action<{}>(),

  // onboarding

  startOnboarding: action<{}>(),
  exitOnboarding: action<{}>(),

  // window events

  windowDestroyed: action<{
    window: string;
  }>(),
  windowFocusChanged: action<{
    window: string;

    /** current state of focusedness */
    focused: boolean;
  }>(),
  windowFullscreenChanged: action<{
    window: string;

    /** current state of fullscreenedness */
    fullscreen: boolean;
  }>(),
  windowMaximizedChanged: action<{
    window: string;

    /** current state of fullscreenedness */
    maximized: boolean;
  }>(),
  windowBoundsChanged: action<{
    window: string;

    bounds: {
      /** left border, in pixels */
      x: number;
      /** top border, in pixels */
      y: number;
      /** in pixels */
      width: number;
      /** in pixels */
      height: number;
    };
  }>(),
  focusWindow: action<{
    window: string;

    /** if set to true, toggle focus instead of always focusing */
    toggle?: boolean;
  }>(),
  hideWindow: action<{
    window: string;
  }>(),
  minimizeWindow: action<{
    window: string;
  }>(),
  toggleMaximizeWindow: action<{
    window: string;
  }>(),

  // navigation
  switchPage: action<{
    /** window identifier */
    window: string;

    /** the page to switch to */
    page: string;
  }>(),

  openTab: action<IOpenTabPayload>(),
  newTab: action<{
    window: string;
  }>(),
  navigate: action<INavigatePayload>(),
  focusTab: action<{
    window: string;

    /** the id of the new tab */
    tab: string;
  }>(),
  focusNthTab: action<{
    window: string;

    /** the index of the constant tab to focus (0-based) */
    index: number;
  }>(),
  moveTab: action<{
    window: string;

    /** old tab index (in transients) */
    before: number;
    /** new tab index (in transients) */
    after: number;
  }>(),
  showNextTab: action<{
    window: string;
  }>(),
  showPreviousTab: action<{
    window: string;
  }>(),

  closeTab: action<{
    window: string;

    /** id of tab to close */
    tab: string;
  }>(),
  closeCurrentTab: action<{
    window: string;
  }>(),
  closeTabOrAuxWindow: action<{
    window: string;
  }>(),
  closeAllTabs: action<{
    window: string;
  }>(),
  closeOtherTabs: action<{
    window: string;

    /** the only transient tab that'll be left */
    tab: string;
  }>(),
  closeTabsBelow: action<{
    window: string;

    /** the tab after which all tabs will be closed */
    tab: string;
  }>(),

  navigateTab: action<INavigateTabPayload>(),
  evolveTab: action<IEvolveTabPayload>(),
  tabReloaded: action<{
    window: string;

    /** the tab that just reloaded */
    tab: string;
  }>(),
  tabChanged: action<{
    window: string;

    /** the newly active tab */
    tab: string;
  }>(),
  tabsChanged: action<{
    window: string;
  }>(),
  tabsRestored: action<{
    window: string;
    snapshot: ItchAppTabs;
  }>(),
  tabDataFetched: action<{
    window: string;

    /** tab for which we fetched data */
    tab: string;

    /** the data we fetched */
    data: TabData;

    /** if true, shallow merge with previous state instead of deep merging */
    shallow?: boolean;
  }>(),
  analyzePage: action<{
    window: string;

    /** Which tab we're analyzing the page for */
    tab: string;

    /** The url we're supposed to analyze */
    url: string;
  }>(),
  tabLoading: action<{
    /** id of tab whose loading status just chagned */
    tab: string;

    /** current loading state */
    loading: boolean;
  }>(),
  tabGotWebContents: action<{
    window: string;

    /** id of tab who just got a webcontents */
    tab: string;
    /** electron id of webcontents */
    webContentsId: number;
  }>(),
  tabLostWebContents: action<{
    window: string;

    /** id of tab who just lost a webcontents */
    tab: string;
  }>(),
  openGameContextMenu: action<
    IOpenContextMenuBase & {
      /** game to open the context menu of */
      game: Game;
    }
  >(),

  viewCreatorProfile: action<{}>(),
  viewCommunityProfile: action<{}>(),

  // menu

  menuChanged: action<{
    /** new menu template */
    template: MenuTemplate;
  }>(),

  // context menus

  popupContextMenu: action<
    IOpenContextMenuBase & {
      /** contents of the context menu */
      template: MenuTemplate;
    }
  >(),
  closeContextMenu: action<{}>(),

  checkForComponentUpdates: action<{}>(),

  quit: action<{}>(),
  quitWhenMain: action<{}>(),

  // locales
  localesConfigLoaded: action<{
    /** initial set of i18n strings */
    strings: I18nResources;
  }>(),
  queueLocaleDownload: action<{
    /** language to download */
    lang: string;

    /** true if not triggered manually */
    implicit?: boolean;
  }>(),
  localeDownloadStarted: action<{
    /** which language just started downloading */
    lang: string;
  }>(),
  localeDownloadEnded: action<{
    /** which language just finished downloading */
    lang: string;

    /** i18n strings */
    resources: I18nKeys;
  }>(),
  reloadLocales: action<{}>(),

  // install locations

  browseInstallLocation: action<{
    /** id of install location to browse */
    id: string;
  }>(),
  addInstallLocation: action<{
    window: string;
  }>(),
  removeInstallLocation: action<{
    /** id of the install location to remove */
    id: string;
  }>(),
  makeInstallLocationDefault: action<{
    /** id of install location to make the default */
    id: string;
  }>(),
  scanInstallLocations: action<{}>(),
  newItemsImported: action<{}>(),
  installLocationsChanged: action<{}>(),

  // tasks

  taskStarted: action<{
    /** name of task that just started */
    name: TaskName;

    /** identifier of the task that just started */
    id: string;

    /** timestamp for the task's start */
    startedAt: number;

    /** identifier of the game the task is tied to */
    gameId: number;
  }>(),
  taskProgress: action<
    ProgressInfo & {
      /** the task this progress info is for */
      id: string;
    }
  >(),
  taskEnded: action<{
    /** the task that just ended */
    id: string;

    /** an error, if any */
    err: string;
  }>(),
  abortTask: action<{
    /** id of the task to abort */
    id: string;
  }>(),

  // downloads

  downloadQueued: action<{}>(),
  downloadsListed: action<{
    downloads: Download[];
  }>(),
  refreshDownloads: action<{}>(),
  downloadProgress: action<{
    download: Download;
    progress: DownloadProgress;
    speedHistory: number[];
  }>(),
  downloadEnded: action<{
    download: Download;
  }>(),
  clearFinishedDownloads: action<{}>(),
  prioritizeDownload: action<{
    /** the download for which we want to show an error dialog */
    id: string;
  }>(),
  showDownloadError: action<{
    /** the download for which we want to show an error dialog */
    id: string;
  }>(),
  discardDownload: action<{
    /** id of download to discard */
    id: string;
  }>(),
  downloadDiscarded: action<{
    /** id of download that was just discarded */
    id: string;
  }>(),
  setDownloadsPaused: action<{
    paused: boolean;
  }>(),
  retryDownload: action<{
    /** id of download to retry */
    id: string;
  }>(),
  clearGameDownloads: action<{
    /** id of game for which to clear downloads */
    gameId: number;
  }>(),

  downloadsRestored: action<{}>(),
  cleanDownloadsSearch: action<{}>(),
  cleanDownloadsFoundEntries: action<{
    /** download subfolders we could remove */
    entries: CleanDownloadsEntry[];
  }>(),
  cleanDownloadsApply: action<{
    /** download subfolders we will remove */
    entries: CleanDownloadsEntry[];
  }>(),

  // game management

  queueGame: action<{
    /** the game we want to download */
    game: Game;
  }>(),
  queueGameInstall: action<{
    /** the game we want to install */
    game: Game;

    /** the upload we picked */
    upload: Upload;
  }>(),
  queueLaunch: action<{ cave: Cave }>(),
  launchEnded: action<{}>(),
  manageGame: action<{
    /** which game to manage */
    game: Game;
  }>(),
  manageCave: action<{
    /** which cave to manage */
    caveId: string;
  }>(),
  requestCaveUninstall: action<{
    /** id of the cave to uninstall */
    caveId: string;
  }>(),
  queueCaveUninstall: action<{
    /** id of the cave to uninstall */
    caveId: string;
  }>(),
  queueCaveReinstall: action<{
    /** id of the cave to reinstall */
    caveId: string;
  }>(),
  uninstallEnded: action<{}>(),
  exploreCave: action<{
    /** id of the cave to explore */
    caveId: string;
  }>(),
  probeCave: action<{
    /** id of the cave to probe */
    caveId: string;
  }>(),
  recordGameInteraction: action<{}>(),
  forceCloseLastGame: action<{}>(),
  forceCloseGameRequest: action<{
    /** the game we want to force-quit */
    game: Game;
  }>(),
  forceCloseGame: action<{
    /** the id of the game we want to force-quit */
    gameId: number;
  }>(),
  checkForGameUpdates: action<{}>(),
  checkForGameUpdate: action<{
    /** which cave to check for an update */
    caveId: string;

    /** display a notification if the game is up-to-date. otherwise, stay silent */
    noisy: boolean;
  }>(),
  gameUpdateCheckStatus: action<{
    /** whether we're currently checking */
    checking: boolean;

    /** how far along we are */
    progress: number;
  }>(),
  gameUpdateAvailable: action<{
    /** the actual update info */
    update: GameUpdate;
  }>(),
  showGameUpdate: action<{
    /** the actual update info */
    update: GameUpdate;
  }>(),
  queueGameUpdate: action<{
    /** the actual update info */
    update: GameUpdate;
  }>(),
  queueAllGameUpdates: action<{}>(),
  switchVersionCaveRequest: action<{
    /** the cave to revert to a different build */
    cave: Cave;
  }>(),
  viewCaveDetails: action<{
    /** the cave to view details of */
    caveId: string;
  }>(),

  // purchase

  initiatePurchase: action<{
    /** the game that might be purchased */
    game: Game;
  }>(),
  purchaseCompleted: action<{
    /** the game that was just purchased */
    game: Game;
  }>(),
  encourageGenerosity: action<{
    /** for which game should we encourage generosity? */
    gameId: number;

    /** how hard should we encourage generosity? */
    level: GenerosityLevel;
  }>(),

  // search

  focusInPageSearch: action<{
    window: string;
  }>(),

  focusSearch: action<{}>(),
  clearFilters: action<{}>(),
  searchQueryChanged: action<{}>(),
  search: action<{
    /** the term to search for */
    query: string;
  }>(),
  searchFetched: action<{
    /** the term we searched for */
    query: string;

    /** the search results */
    results: SearchResults;
  }>(),
  searchStarted: action<{}>(),
  searchFinished: action<{}>(),
  closeSearch: action<{}>(),
  searchHighlightOffset: action<{
    /** search highlight offset */
    offset: number;

    /** true if should be added to current offset, false if absolute */
    relative: boolean;
  }>(),

  // preferences

  updatePreferences: action<PreferencesState>(),
  preferencesLoaded: action<PreferencesState>(),
  clearBrowsingDataRequest: action<{
    window: string;
  }>(),
  clearBrowsingData: action<{
    /** Whether to wipe cached images & files */
    cache: boolean;

    /** Whether to wipe cookies (will log out user) */
    cookies: boolean;
  }>(),
  openAtLoginError: action<IOpenAtLoginError>(),

  // internal

  setReduxLoggingEnabled: action<{
    /** true if should show in the chrome console */
    enabled: boolean;
  }>(),

  // misc.

  gcDatabase: action<{}>(),
  /** macOS-only, bounce dock */
  bounce: action<{}>(),
  /** cross-platform, notification bubble */
  notify: action<{
    /** title of the notification, defaults to `itch` */
    title?: string;

    /** main text of the notification */
    body: string;

    /** path to the icon (on fs, can be relative to `app/`), defaults to itch icon */
    icon?: string;

    /** action to dispatch if notification is clicked */
    onClick?: Action<any>;
  }>(),
  statusMessage: action<{
    /** the message we want to show in the status bar */
    message: LocalizedString;
  }>(),
  dismissStatusMessage: action<{}>(),
  commandMain: action<{
    window: string;
  }>(),
  commandOk: action<{
    window: string;
  }>(),
  commandBack: action<{
    window: string;
  }>(),
  commandGoBack: action<{
    window: string;
  }>(),
  commandGoForward: action<{
    window: string;
  }>(),
  commandLocation: action<{
    window: string;
  }>(),
  commandReload: action<{
    window: string;
  }>(),
  commandStop: action<{
    window: string;
  }>(),
  commandFocusLocation: action<{
    window: string;
  }>(),
  tabGoBack: action<{
    window: string;
    tab: string;
  }>(),
  tabGoForward: action<{
    window: string;
    tab: string;
  }>(),
  tabStop: action<{
    window: string;
    tab: string;
  }>(),

  openInExternalBrowser: action<{
    /** the URL to open in an external web browser */
    url: string;
  }>(),
  openAppLog: action<{}>(),
  openDevTools: action<{
    /** if true, should open dev tools for app, not the current tab */
    forApp: boolean;

    window?: string;
  }>(),
  reportIssue: action<{
    /** error log that should be included in the issue report */
    log?: string;
  }>(),
  viewChangelog: action<{}>(),
  copyToClipboard: action<{
    /** text to copy to clipboard */
    text: string;
  }>(),
});
