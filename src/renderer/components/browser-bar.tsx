import React from "react";

import { Space } from "common/helpers/space";
import FiltersContainer from "./filters-container";
import { withTab } from "renderer/components/meats/tab-provider";
import { ITabInstance } from "common/types";
import { withTabInstance } from "./meats/tab-instance-provider";

class _BrowserBar extends React.PureComponent<Props> {
  render() {
    const { tabInstance } = this.props;
    const sp = Space.fromInstance(tabInstance);
    const loading = !!sp.web().loading;
    return <FiltersContainer loading={loading} />;
  }
}

interface Props {
  tabInstance: ITabInstance;
}

const BrowserBar = withTab(withTabInstance(_BrowserBar));
export default BrowserBar;
