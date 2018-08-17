import { Space } from "common/helpers/space";
import React from "react";
import FiltersContainer from "renderer/basics/FiltersContainer";
import { withSpace } from "renderer/hocs/withSpace";

class BrowserBar extends React.PureComponent<Props> {
  render() {
    const { space } = this.props;
    return <FiltersContainer loading={space.isLoading()} />;
  }
}

interface Props {
  space: Space;
}

export default withSpace(BrowserBar);
