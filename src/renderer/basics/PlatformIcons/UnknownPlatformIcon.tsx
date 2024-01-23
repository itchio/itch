import React from "react";
import Icon from "renderer/basics/Icon";
import platformData, { PlatformHolder } from "common/constants/platform-data";
import { _ } from "renderer/t";

export default class PlatformIcon extends React.PureComponent<Props> {
  render() {
    const { before } = this.props;
    const data = platformData.unknown;
    return (
      <>
        {before}
        <Icon hint={_("platform.unknown")} icon={data.icon} />
      </>
    );
  }
}

interface Props {
  before?: React.ReactNode;
}
