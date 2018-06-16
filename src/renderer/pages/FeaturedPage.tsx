import { actions } from "common/actions";
import urls from "common/constants/urls";
import { rendererWindow } from "common/util/navigation";
import React from "react";
import { Dispatch, withDispatch } from "renderer/hocs/withDispatch";
import { withTab } from "renderer/hocs/withTab";

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
