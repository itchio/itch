import { Cave, Profile } from "common/butlerd/messages";
import { OngoingLaunch, OngoingLaunches } from "common/launches";
import { CurrentLocale } from "common/locales";
import { WebviewState } from "main";
import { DownloadsState } from "common/downloads";
import { ModalCreator } from "common/modals";

export const queries = wireQueries({
  minimize: query<void, void>(),
  toggleMaximized: query<void, void>(),
  isMaximized: query<void, { maximized: boolean }>(),
  close: query<void, void>(),

  getWebviewState: query<void, { state: WebviewState }>(),
  setWebviewState: query<{ state: WebviewState }, void>(),

  getProfile: query<void, { profile: Profile }>(),
  setProfile: query<
    { profile?: Profile; cookie?: Record<string, string> },
    void
  >(),

  getDownloads: query<void, { downloads: DownloadsState }>(),
  getDownloadsForGame: query<
    { gameId: number },
    { downloads: DownloadsState }
  >(),

  openDevTools: query<void, void>(),

  getCurrentLocale: query<void, { currentLocale: CurrentLocale }>(),
  switchLanguage: query<{ lang: string }, void>(),

  showModal: query<{ mc: ModalCreator<any, any>; params: any }, any>(),

  launchGame: query<{ gameId: number; caveId?: string }, void>(),
  exploreCave: query<{ caveId: string }, void>(),
  uninstallGame: query<{ cave: Cave }, void>(),

  getOngoingLaunchesForGame: query<
    { gameId: number },
    { launches: OngoingLaunch[] }
  >(),

  getOngoingLaunches: query<void, { launches: OngoingLaunches }>(),

  openExternalURL: query<{ url: string }, void>(),

  // this is a query because we need to make sure the main process
  // has received the modal result *before* the modal closes
  modalResult: query<{ id: string; result: any }, {}>(),
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
  error: Error;
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
