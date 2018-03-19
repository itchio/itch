import * as React from "react";

import BrowserControls from "./browser-controls";

import { IBrowserControlProps } from "./browser-state";

import { Space } from "../helpers/space";
import FiltersContainer from "./filters-container";

class BrowserBar extends React.PureComponent<IProps> {
  render() {
    const { tabInstance } = this.props;
    const sp = Space.fromInstance(tabInstance);

    const loading = !!sp.web().loading;
    const url = this.props.url;

    return (
      <FiltersContainer loading={loading}>
        <BrowserControls
          {...this.props}
          url={url}
          showAddressBar
          loading={loading}
        />
      </FiltersContainer>
    );
  }
}

export default BrowserBar;

interface IProps extends IBrowserControlProps {}
