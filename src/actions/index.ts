import {
  IDispatch,
  IAction,
  ISystemTasksState,
  ProxySource,
  ICommonsState,
  IModalAction,
  ISetupOperation,
  IItchAppTabs,
  ITabParams,
  IMenuTemplate,
  ISelfUpdate,
  II18nResources,
  II18nKeys,
  IProgressInfo,
  IOpenTabPayload,
  IQueueLaunchOpts,
  GenerosityLevel,
  ISearchResults,
  IPreferencesState,
  IOpenAtLoginError,
  ILocalizedString,
  IOpenContextMenuBase,
  ModalResponse,
  ITabData,
  INavigatePayload,
  IEvolveTabPayload,
  INavigateTabPayload,
} from "../types/index";
import {
  Game,
  Upload,
  User,
  CleanDownloadsEntry,
  GameUpdate,
  Profile,
  Collection,
  Download,
  DownloadProgress,
  InstallLocationSummary,
} from "../buse/messages";
import { TaskName } from "../types/tasks";
import {
  ITypedModal,
  ITypedModalUpdate,
} from "../components/modal-widgets/index";

export interface ActionCreator<PayloadType> {
  payload: PayloadType;
  (payload: PayloadType): IAction<PayloadType>;
}

export function action<PayloadType>(): ActionCreator<PayloadType> {
  const ret = (type: string) => (
    payload: PayloadType
  ): IAction<PayloadType> => {
    return {
      type,
      payload,
    };
  };
  // bending typing rules a bit, forgive me
  return ret as any;
}

export function dispatcher<T, U>(
  dispatch: IDispatch,
  actionCreator: (payload: T) => IAction<U>
) {
  return (payload: T) => {
    const action = actionCreator(payload);
    dispatch(action);
    return action;
  };
}

interface IMirrorInput {
  [key: string]: ActionCreator<any>;
}

type IMirrorOutput<T> = { [key in keyof T]: T[key] };

function wireActions<T extends IMirrorInput>(input: T): IMirrorOutput<T> {
  const res: IMirrorOutput<T> = {} as any;
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
  scheduleSystemTask: action<Partial<ISystemTasksState>>(),
  firstUsefulPage: action<{}>(),
  languageSniffed: action<{
    lang: string;
  }>(),
  languageChanged: action<{
    lang: string;
  }>(),
  processUrlArguments: action<{
    /** these are command-line arguments */
    args: string[];
  }>(),
  handleItchioUrl: action<{
    /** example: itchio:///games/3 */
    uri: string;
  }>(),
  proxySettingsDetected: action<{
    /** a valid HTTP(S) proxy string (that could be in $HTTP_PROXY) */
    proxy: string;
    source: ProxySource;
  }>(),
  commonsUpdated: action<Partial<ICommonsState>>(),

  // modals

  openModal: action<ITypedModal<any, any>>(),
  updateModalWidgetParams: action<ITypedModalUpdate<any>>(),
  closeModal: action<{
    /** id of the modal to close - if unspecified, close frontmost */
    id?: string;

    /** action that should be dispatched once the modal's been closed */
    action?: IModalAction;
  }>(),
  modalClosed: action<{
    /** id of the modal that was just closed */
    id: string;

    /** if there was a response, it's here */
    response: ModalResponse | null;
  }>(),
  modalResponse: action<any>(),

  // setup

  setupStatus: action<ISetupOperation>(),
  setupDone: action<{}>(),
  retrySetup: action<{}>(),

  // login

  loginStartPicking: action<{}>(),
  loginStopPicking: action<{}>(),
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

    /** a list of errors that occured while logging in */
    errors: string[];
  }>(),
  loginCancelled: action<{}>(),
  loginSucceeded: action<{
    /** Profile we just logged in as */
    profile: Profile;
  }>(),

  profileReady: action<{}>(),
  forgetProfileRequest: action<{
    /** Profile to forget */
    profile: Profile;
  }>(),
  forgetProfile: action<{
    /** Profile to forget */
    profile: Profile;
  }>(),

  changeUser: action<{}>(),
  logout: action<{}>(),

  // onboarding

  startOnboarding: action<{}>(),
  exitOnboarding: action<{}>(),

  // window events

  firstWindowReady: action<{}>(),
  windowReady: action<{
    /** electron window id */
    id: number;
  }>(),
  windowDestroyed: action<{}>(),
  windowFocusChanged: action<{
    /** current state of focusedness */
    focused: boolean;
  }>(),
  windowFullscreenChanged: action<{
    /** current state of fullscreenedness */
    fullscreen: boolean;
  }>(),
  windowMaximizedChanged: action<{
    /** current state of fullscreenedness */
    maximized: boolean;
  }>(),
  windowBoundsChanged: action<{
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
  createWindow: action<{}>(),
  focusWindow: action<{
    /** if set to true, toggle focus instead of always focusing */
    toggle?: boolean;

    /** if set to true, create window as hidden if it doesn't exist, does nothing otherwise */
    hidden?: boolean;
  }>(),
  hideWindow: action<{}>(),
  minimizeWindow: action<{}>(),
  toggleMaximizeWindow: action<{}>(),

  // navigation

  switchPage: action<{
    /** the page to switch to */
    page: string;
  }>(),
  unlockTab: action<{
    /** the url of the tab to unlock (press, dashboard, etc.) */
    url: string;
  }>(),

  openTab: action<IOpenTabPayload>(),
  newTab: action<{}>(),
  navigate: action<INavigatePayload>(),
  navigateToUser: action<{
    /** user to navigate to */
    user: User;

    /** whether to open in a new tab or not */
    background?: boolean;
  }>(),
  navigateToGame: action<{
    /** game to navigate to */
    game: Game;

    /** whether to open in a new tab or not */
    background?: boolean;
  }>(),
  navigateToCollection: action<{
    /** navigation to navigate to */
    collection: Collection;

    /** whether to open in a new tab or not */
    background?: boolean;
  }>(),
  navigateToInstallLocation: action<{
    /** install location to navigate to */
    installLocation: InstallLocationSummary;

    /** whether to open in a new tab or not */
    background?: boolean;
  }>(),
  focusTab: action<{
    /** the id of the new tab */
    tab: string;
  }>(),
  focusNthTab: action<{
    /** the index of the constant tab to focus (0-based) */
    index: number;
  }>(),
  moveTab: action<{
    /** old tab index (in transients) */
    before: number;
    /** new tab index (in transients) */
    after: number;
  }>(),
  showNextTab: action<{}>(),
  showPreviousTab: action<{}>(),

  closeTab: action<{
    /** id of tab to close */
    tab: string;
  }>(),
  closeCurrentTab: action<{}>(),
  closeTabOrAuxWindow: action<{}>(),
  closeAllTabs: action<{}>(),
  closeOtherTabs: action<{
    /** the only transient tab that'll be left */
    tab: string;
  }>(),
  closeTabsBelow: action<{
    /** the tab after which all tabs will be closed */
    tab: string;
  }>(),

  navigateTab: action<INavigateTabPayload>(),
  evolveTab: action<IEvolveTabPayload>(),
  tabReloaded: action<{
    /** the tab that just reloaded */
    tab: string;
  }>(),
  tabChanged: action<{
    /** the newly active tab */
    tab: string;
  }>(),
  tabsChanged: action<{}>(),
  tabsRestored: action<IItchAppTabs>(),
  tabDataFetched: action<{
    /** tab for which we fetched data */
    tab: string;

    /** the data we fetched */
    data: ITabData;

    /** if true, deep merge with previous state instead of shallow merging */
    shallow?: boolean;
  }>(),
  tabParamsChanged: action<{
    /** tab for which the params are changing */
    tab: string;

    /** the params that changed (deep partial) */
    params: ITabParams;
  }>(),
  analyzePage: action<{
    /** Which tab we're analyzing the page for */
    tab: string;

    /** The url we're supposed to analyze */
    url: string;

    /** Are we analyzing an iframe or the main page? */
    iframe: boolean;
  }>(),
  tabLoading: action<{
    /** id of tab whose loading status just chagned */
    tab: string;

    /** current loading state */
    loading: boolean;
  }>(),
  tabGotWebContents: action<{
    /** id of tab who just got a webcontents */
    tab: string;
    /** electron id of webcontents */
    webContentsId: number;
  }>(),

  openTabContextMenu: action<
    IOpenContextMenuBase & {
      /** id of the tab to open the context menu of */
      tab: string;
    }
  >(),
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
    template: IMenuTemplate;
  }>(),

  // context menus

  popupContextMenu: action<
    IOpenContextMenuBase & {
      /** contents of the context menu */
      template: IMenuTemplate;
    }
  >(),
  closeContextMenu: action<{}>(),

  // self-update & quit

  prepareQuit: action<{}>(),
  quit: action<{}>(),
  quitWhenMain: action<{}>(),
  quitElectronApp: action<{}>(),
  quitAndInstall: action<{}>(),
  checkForSelfUpdate: action<{}>(),
  checkingForSelfUpdate: action<{}>(),
  selfUpdateAvailable: action<{
    /** info on the self-update that's available */
    spec: ISelfUpdate;

    /** whether the self-update is being immediately downloaded */
    downloading: boolean;
  }>(),
  selfUpdateNotAvailable: action<{
    /**
     * true if it also means we're up-to-date — false if, for example,
     * we were offline and couldn't check (that doesn't count as an error)
     */
    uptodate: boolean;
  }>(),
  selfUpdateError: action<{
    /** the error message of the self-updater */
    message: string;
  }>(),
  selfUpdateDownloaded: action<{}>(),
  showAvailableSelfUpdate: action<{}>(),
  applySelfUpdateRequest: action<{}>(),
  applySelfUpdate: action<{}>(),
  snoozeSelfUpdate: action<{}>(),

  // locales

  localesConfigLoaded: action<{
    /** initial set of i18n strings */
    strings: II18nResources;
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
    resources: II18nKeys;
  }>(),
  reloadLocales: action<{}>(),

  // install locations

  browseInstallLocation: action<{
    /** id of install location to browse */
    id: string;
  }>(),
  addInstallLocation: action<{}>(),
  removeInstallLocation: action<{
    /** id of the install location to remove */
    id: string;
  }>(),
  makeInstallLocationDefault: action<{
    /** id of install location to make the default */
    id: string;
  }>(),
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
    IProgressInfo & {
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
  pauseDownloads: action<{}>(),
  resumeDownloads: action<{}>(),
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
  queueLaunch: action<IQueueLaunchOpts>(),
  launchEnded: action<{}>(),
  manageGame: action<{
    /** which game to manage */
    game: Game;
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
  reportCave: action<{
    /** id of the cave to report */
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
  revertCaveRequest: action<{
    /** the cave to revert to a different build */
    caveId: string;
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
    results: ISearchResults;
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

  updatePreferences: action<IPreferencesState>(),
  preferencesLoaded: action<IPreferencesState>(),
  clearBrowsingDataRequest: action<{}>(),
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
    onClick?: IAction<any>;
  }>(),
  dismissStatus: action<{}>(),
  statusMessage: action<{
    /** the message we want to show in the status bar */
    message: ILocalizedString;
  }>(),
  dismissStatusMessage: action<{}>(),
  commandMain: action<{}>(),
  commandOk: action<{}>(),
  commandBack: action<{}>(),
  commandGoBack: action<{}>(),
  commandGoForward: action<{}>(),
  commandLocation: action<{}>(),
  commandReload: action<{}>(),
  commandStop: action<{}>(),
  commandFocusLocation: action<{}>(),
  tabGoBack: action<{
    tab: string;
  }>(),
  tabGoForward: action<{
    tab: string;
  }>(),
  tabStop: action<{
    tab: string;
  }>(),
  openUrl: action<{
    /** the URL to open in an external web browser */
    url: string;
  }>(),
  openAppLog: action<{}>(),
  openDevTools: action<{
    /** if true, should open dev tools for app, not the current tab */
    forApp: boolean;
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
