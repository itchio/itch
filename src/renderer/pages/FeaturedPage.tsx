import urls from "common/constants/urls";
import { Space } from "common/helpers/space";
import { Dispatch } from "common/types";
import React from "react";
import { hook } from "renderer/hocs/hook";
import { withSpace } from "renderer/hocs/withSpace";
import { ambientWind } from "common/util/navigation";
import { MeatProps } from "renderer/scenes/HubScene/Meats/types";

class FeaturedPage extends React.PureComponent<Props> {
  render() {
    const { space, dispatch } = this.props;

    dispatch(
      space.makeEvolve({
        wind: ambientWind(),
        replace: true,
        url: urls.itchio,
      })
    );

    return null as JSX.Element;
  }
}

interface Props extends MeatProps {
  space: Space;
  dispatch: Dispatch;
}

export default withSpace(hook()(FeaturedPage));
