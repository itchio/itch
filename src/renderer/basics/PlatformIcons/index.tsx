import React from "react";
import styled from "renderer/styles";
import PlatformIcon from "renderer/basics/PlatformIcons/PlatformIcon";
import Icon from "renderer/basics/Icon";
import { PlatformHolder } from "common/constants/platform-data";

const PlatformIconsDiv = styled.span`
  .icon {
    margin-left: 8px;

    &:first-child {
      margin-left: 0;
    }
  }
`;

class PlatformIcons extends React.PureComponent<Props> {
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

interface Props {
  target: PlatformHolder;
  className?: string;
}
