import { Space } from "common/helpers/space";
import React from "react";
import FiltersContainer from "renderer/basics/FiltersContainer";
import { withSpace } from "renderer/hocs/withSpace";

class BrowserBar extends React.PureComponent<Props> {
  render() {
    const { space } = this.props;
    const loading = !!space.web().loading;
    return <FiltersContainer loading={loading} />;
  }
}

interface Props {
  space: Space;
}

export default withSpace(BrowserBar);
