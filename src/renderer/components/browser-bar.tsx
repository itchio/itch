import React from "react";

import { IBrowserControlProps } from "./browser-state";

import { Space } from "common/helpers/space";
import FiltersContainer from "./filters-container";
import { withTab } from "renderer/components/meats/tab-provider";

class BrowserBar extends React.PureComponent<IProps> {
  render() {
    const { tabInstance } = this.props;
    const sp = Space.fromInstance(tabInstance);

    const loading = !!sp.web().loading;

    return <FiltersContainer loading={loading} />;
  }
}

export default withTab(BrowserBar);

interface IProps extends IBrowserControlProps {}
