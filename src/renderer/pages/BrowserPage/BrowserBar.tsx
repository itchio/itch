import React from "react";

import { Space } from "common/helpers/space";
import FiltersContainer from "renderer/basics/FiltersContainer";
import { TabInstance } from "common/types";
import { withTabInstance } from "renderer/hocs/withTabInstance";
import { withTab } from "renderer/hocs/withTab";

class BrowserBar extends React.PureComponent<Props> {
  render() {
    const { tabInstance } = this.props;
    const sp = Space.fromInstance(tabInstance);
    const loading = !!sp.web().loading;
    return <FiltersContainer loading={loading} />;
  }
}

interface Props {
  tabInstance: TabInstance;
}

export default withTab(withTabInstance(BrowserBar));
