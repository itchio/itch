import urls from "common/constants/urls";
import { Space } from "common/helpers/space";
import React from "react";
import { Dispatch, withDispatch } from "renderer/hocs/withDispatch";
import { withSpace } from "renderer/hocs/withSpace";

class FeaturedPage extends React.PureComponent<Props> {
  render() {
    const { space, dispatch } = this.props;

    dispatch(
      space.makeEvolve({
        replace: true,
        url: urls.itchio,
      })
    );

    return null;
  }
}

interface Props {
  space: Space;
  dispatch: Dispatch;
}

export default withSpace(withDispatch(FeaturedPage));
