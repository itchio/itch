import { Subtract, EvolveTabPayload, Dispatch } from "common/types";
import { actions } from "common/actions";
import { ambientWind } from "common/util/navigation";

interface TabProps {
  dispatch: Dispatch;
  tab: string;
}

export function dispatchTabEvolve(
  props: TabProps,
  payload: Subtract<
    EvolveTabPayload,
    {
      tab: string;
      wind: string;
    }
  >
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
  payload: Subtract<
    typeof actions.openTabBackHistory["payload"],
    {
      tab: string;
      wind: string;
    }
  >
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
    {
      tab: string;
      wind: string;
    }
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
