import { Profile } from "common/butlerd/messages";
import { OngoingLaunch } from "common/launches";
import { CurrentLocale } from "common/locales";
import { WebviewState } from "main";
import { DownloadWithProgress } from "main/drive-downloads";

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

  getDownloads: query<void, { downloads: DownloadWithProgress[] }>(),
  getDownloadsForGame: query<
    { gameId: number },
    { downloads: DownloadWithProgress[] }
  >(),

  getCurrentLocale: query<void, { currentLocale: CurrentLocale }>(),
  switchLanguage: query<{ lang: string }, void>(),

  launchGame: query<{ gameId: number }, void>(),
  getOngoingLaunchesForGame: query<
    { gameId: number },
    { launches: OngoingLaunch[] }
  >(),

  openExternalURL: query<{ url: string }, void>(),
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
