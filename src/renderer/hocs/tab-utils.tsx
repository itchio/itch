import {
  Subtract,
  EvolveTabPayload,
  Dispatch,
  QueryParams,
} from "common/types";
import { actions } from "common/actions";
import { ambientWind } from "common/util/navigation";
import * as urlParser from "url";
import * as querystring from "querystring";

interface TabProps {
  dispatch: Dispatch;
  tab: string;
}

interface ScopeFields {
  wind: string;
  tab: string;
}

export function dispatchTabLoadingStateChanged(
  props: TabProps,
  loading: boolean
) {
  const { tab, dispatch } = props;
  dispatch(
    actions.tabLoadingStateChanged({
      wind: ambientWind(),
      tab,
      loading,
    })
  );
}

export function dispatchTabGotWebContents(
  props: TabProps,
  webContentsId: number
) {
  const { tab, dispatch } = props;
  dispatch(
    actions.tabGotWebContents({
      wind: ambientWind(),
      tab,
      webContentsId,
    })
  );
}

export function dispatchTabLosingWebContents(props: TabProps) {
  const { tab, dispatch } = props;
  dispatch(
    actions.tabLosingWebContents({
      wind: ambientWind(),
      tab,
    })
  );
}

export function dispatchTabEvolve(
  props: TabProps,
  payload: Subtract<EvolveTabPayload, ScopeFields>
) {
  const { tab, dispatch } = props;
  dispatch(
    actions.evolveTab({
      wind: ambientWind(),
      tab,
      ...payload,
    })
  );
}

export function dispatchTabPageUpdate(
  props: TabProps,
  page: typeof actions.tabPageUpdate["payload"]["page"]
) {
  const { tab, dispatch } = props;
  dispatch(
    actions.tabPageUpdate({
      wind: ambientWind(),
      tab,
      page,
    })
  );
}

export function dispatchTabReloaded(props: TabProps) {
  const { tab, dispatch } = props;
  dispatch(
    actions.tabReloaded({
      wind: ambientWind(),
      tab,
    })
  );
}

export function dispatchTabStop(props: TabProps) {
  const { tab, dispatch } = props;
  dispatch(
    actions.tabStop({
      wind: ambientWind(),
      tab,
    })
  );
}

export function dispatchTabGoForward(props: TabProps) {
  const { tab, dispatch } = props;
  dispatch(
    actions.tabGoForward({
      wind: ambientWind(),
      tab,
    })
  );
}

export function dispatchTabGoBack(props: TabProps) {
  const { tab, dispatch } = props;
  dispatch(
    actions.tabGoBack({
      wind: ambientWind(),
      tab,
    })
  );
}

export function dispatchOpenTabBackHistory(
  props: TabProps,
  payload: Subtract<typeof actions.openTabBackHistory["payload"], ScopeFields>
) {
  const { tab, dispatch } = props;
  dispatch(
    actions.openTabBackHistory({
      wind: ambientWind(),
      tab,
      ...payload,
    })
  );
}

export function dispatchOpenTabForwardHistory(
  props: TabProps,
  payload: Subtract<
    typeof actions.openTabForwardHistory["payload"],
    ScopeFields
  >
) {
  const { tab, dispatch } = props;
  dispatch(
    actions.openTabForwardHistory({
      wind: ambientWind(),
      tab,
      ...payload,
    })
  );
}

export function urlWithParams(url: string, params: QueryParams): string {
  const parsed = urlParser.parse(url);
  let finalParams = querystring.parse(parsed.query);
  for (const k of Object.keys(params)) {
    const v = params[k];
    if (!v) {
      delete finalParams[k];
    } else {
      finalParams[k] = v;
    }
  }
  const query = querystring.stringify(finalParams);
  parsed.search = query ? `?${query}` : "";
  return urlParser.format(parsed);
}
