import React from "react";
import { actions } from "common/actions";
import { rendererWindow } from "common/util/navigation";
import { Dispatch, withDispatch } from "./dispatch-provider";
import { withTab } from "./meats/tab-provider";
import urls from "common/constants/urls";

class _FeaturedPage extends React.PureComponent<Props> {
  render() {
    const { tab, dispatch } = this.props;

    dispatch(
      actions.evolveTab({
        window: rendererWindow(),
        tab,
        replace: true,
        url: urls.itchio,
      })
    );

    return null;
  }
}

interface Props {
  tab: string;
  dispatch: Dispatch;
}

const FeaturedPage = withTab(withDispatch(_FeaturedPage));
export default FeaturedPage;
