import React from "react";
import Icon from "renderer/basics/Icon";
import platformData, { PlatformHolder } from "common/constants/platform-data";

export default class PlatformIcon extends React.PureComponent<Props> {
  render() {
    const { target, field } = this.props;
    if (!target[field]) {
      return null;
    }

    const data = platformData[field];
    return <Icon hint={data.platform} icon={data.icon} />;
  }
}

interface Props {
  target: PlatformHolder;
  field: keyof typeof platformData;
}
