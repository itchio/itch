import * as React from "react";

import Icon from "./icon";

import platformData, { PlatformHolder } from "../../constants/platform-data";

import styled from "../styles";

const PlatformIconsDiv = styled.span`
  .icon {
    margin-left: 8px;

    &:first-child {
      margin-left: 0;
    }
  }
`;

class PlatformIcon extends React.PureComponent<IIconProps> {
  render() {
    const { target, field } = this.props;
    if (!target[field]) {
      return null;
    }

    const data = platformData[field];
    return <Icon hint={data.platform} icon={data.icon} />;
  }
}

interface IIconProps {
  target: PlatformHolder;
  field: keyof typeof platformData;
}

export default class PlatformIcons extends React.PureComponent<IProps> {
  render() {
    const { target } = this.props;
    return (
      <PlatformIconsDiv>
        <PlatformIcon field="pWindows" target={target} />
        <PlatformIcon field="pOsx" target={target} />
        <PlatformIcon field="pLinux" target={target} />
        {target.type === "html" ? <Icon icon="earth" hint="web" /> : null}
      </PlatformIconsDiv>
    );
  }
}

interface IProps {
  target: PlatformHolder;
}
