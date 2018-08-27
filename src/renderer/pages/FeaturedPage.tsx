import urls from "common/constants/urls";
import { Dispatch } from "common/types";
import React from "react";
import { hook } from "renderer/hocs/hook";
import { dispatchTabEvolve } from "renderer/hocs/tab-utils";
import { withTab } from "renderer/hocs/withTab";
import { MeatProps } from "renderer/scenes/HubScene/Meats/types";

class FeaturedPage extends React.PureComponent<Props> {
  render() {
    dispatchTabEvolve(this.props, {
      replace: true,
      url: urls.itchio,
    });

    return null as JSX.Element;
  }
}

interface Props extends MeatProps {
  tab: string;
  dispatch: Dispatch;
}

export default withTab(hook()(FeaturedPage));
