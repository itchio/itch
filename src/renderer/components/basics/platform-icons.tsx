import React from "react";

import Icon from "./icon";

import platformData, { PlatformHolder } from "common/constants/platform-data";

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

class PlatformIcons extends React.PureComponent<IProps> {
  render() {
    const { target, ...restProps } = this.props;
    if (
      !target.pWindows &&
      !target.pLinux &&
      !target.pOsx &&
      target.type !== "html"
    ) {
      return null;
    }

    return (
      <PlatformIconsDiv {...restProps}>
        <PlatformIcon field="pWindows" target={target} />
        <PlatformIcon field="pOsx" target={target} />
        <PlatformIcon field="pLinux" target={target} />
        {target.type === "html" ? <Icon icon="html5" hint="web" /> : null}
      </PlatformIconsDiv>
    );
  }
}

export default PlatformIcons;

interface IProps {
  target: PlatformHolder;
  className?: string;
}
