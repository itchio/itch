import React from "react";
import styled from "renderer/styles";
import PlatformIcon from "renderer/basics/PlatformIcons/PlatformIcon";
import Icon from "renderer/basics/Icon";
import { PlatformHolder, hasPlatforms } from "common/constants/platform-data";

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
    const { target, before, ...restProps } = this.props;
    if (!hasPlatforms(target)) {
      return null;
    }

    return (
      <>
        {before ? before() : null}
        <PlatformIconsDiv {...restProps}>
          <PlatformIcon field="windows" target={target} />
          <PlatformIcon field="osx" target={target} />
          <PlatformIcon field="linux" target={target} />
          {target.type === "html" ? <Icon icon="html5" hint="web" /> : null}
        </PlatformIconsDiv>
      </>
    );
  }
}

export default PlatformIcons;

interface Props {
  target: PlatformHolder;
  className?: string;
  before?: () => JSX.Element;
}
