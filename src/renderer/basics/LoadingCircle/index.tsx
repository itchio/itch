import React from "react";
import classNames from "classnames";

import styled, { keyframes } from "renderer/styles";
import Circle from "renderer/basics/LoadingCircle/Circle";

const turn = keyframes`
  0% {
    transform: rotateZ(0deg);
  }
  100% {
    transform: rotateZ(360deg);
  }
`;

const CircleContainer = styled.span`
  display: inline;
  margin-right: 8px;

  animation: ${turn} 6s infinite linear;
  display: flex;
  align-items: center;
  justify-content: center;

  &.bare {
    margin-right: 0;
  }

  svg {
    width: 14px;
    height: 14px;
  }

  &.wide {
    svg {
      width: 18px;
      height: 18px;
    }
  }
`;

class LoadingCircle extends React.PureComponent<LoadingCircleProps> {
  render() {
    const { className, progress, bare, wide } = this.props;

    return (
      <CircleContainer className={classNames(className, { bare, wide })}>
        <Circle
          percent={progress > 0 ? progress * 100.0 : 100 / 3}
          trailWidth={3}
          trailColor="#e0e0e2"
          strokeWidth={15}
          strokeColor="white"
        />
      </CircleContainer>
    );
  }
}

export default LoadingCircle;

interface LoadingCircleProps {
  className?: string;
  progress: number;
  bare?: boolean;
  wide?: boolean;
}
