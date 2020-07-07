import { Cave, Profile } from "@itchio/valet/messages";
import { DownloadsState } from "common/downloads";
import { OngoingLaunches } from "common/launches";
import { CurrentLocale } from "common/locales";
import { ModalCreator } from "common/modals";
import { PreferencesState } from "common/preferences";
import { WebviewState } from "common/webview-state";

/**
 * Queries are asynchronous calls made from a renderer process
 * to the main process.
 */
export const queries = wireQueries({
  minimize: query<void, void>(),
  toggleMaximized: query<void, void>(),
  isMaximized: query<void, { maximized: boolean }>(),
  close: query<void, void>(),

  restoreWebviewState: query<{ wcId: number }, void>(),
  saveWebviewState: query<{ wcId: number }, void>(),
  openWebviewDevTools: query<{ wcId: number }, void>(),
  getWebviewState: query<{ wcId: number }, { state: WebviewState }>(),
  webviewGoBack: query<{ wcId: number }, void>(),
  webviewGoForward: query<{ wcId: number }, void>(),
  webviewStop: query<{ wcId: number }, void>(),
  webviewReload: query<{ wcId: number }, void>(),
  webviewPopout: query<{ wcId: number }, void>(),

  exit: query<void, void>(),

  getProfile: query<void, { profile: Profile }>(),
  setProfile: query<
    { profile?: Profile; cookie?: Record<string, string> },
    void
  >(),

  getPreferences: query<void, { preferences: PreferencesState }>(),
  updatePreferences: query<{ preferences: Partial<PreferencesState> }, void>(),

  getDownloads: query<void, { downloads: DownloadsState }>(),
  getDownloadsForGame: query<
    { gameId: number },
    { downloads: DownloadsState }
  >(),

  openDevTools: query<void, void>(),

  getCurrentLocale: query<void, { currentLocale: CurrentLocale }>(),
  switchLanguage: query<{ lang: string }, void>(),

  showModal: query<{ mc: ModalCreator<any, any>; params: any }, any>(),

  exploreCave: query<{ caveId: string }, void>(),
  uninstallGame: query<{ cave: Cave }, void>(),

  launchGame: query<{ gameId: number; caveId?: string }, void>(),
  getOngoingLaunches: query<void, { launches: OngoingLaunches }>(),
  cancelLaunch: query<{ launchId: string; reason: string }, void>(),

  openExternalURL: query<{ url: string }, void>(),

  // this is a query (and not a packet) because we need to make sure the main
  // process has received the modal result *before* the modal closes
  modalResult: query<{ id: string; result: any }, void>(),
  modalDidLayout: query<{ id: string; width: number; height: number }, void>(),

  testValet: query<{}, string>(),

  selfUpdateCheck: query<void, void>(),
});

export interface QueryRequest<Params> {
  id: number;
  method: string;
  params: Params;
}

export type QueryResult<Result> = QueryResultSuccess<Result> | QueryResultError;

interface QueryResultSuccess<Result> {
  state: "success";
  id: number;
  result: Result;
}

interface QueryResultError {
  state: "error";
  id: number;
  error: ErrorObject;
}

export interface ErrorObject {
  message: string;
  stack?: string;
  side: "main";
}

export interface QueryCreator<Params, Result> {
  __method: string;
  __params: Params;
  __result: Result;
}

function query<Params, Result>(): QueryCreator<Params, Result> {
  // that's a lie, we're tricking the type system
  return null as any;
}

interface MirrorInput {
  [key: string]: QueryCreator<any, any>;
}

type MirrorOutput<T> = { [key in keyof T]: T[key] };

function wireQueries<T extends MirrorInput>(input: T): MirrorOutput<T> {
  const res = {} as any;
  for (const k of Object.keys(input)) {
    res[k] = {
      __method: k,
    };
  }
  return res as MirrorOutput<T>;
}
