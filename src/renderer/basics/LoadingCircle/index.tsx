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

  animation: ${turn} 6s infinite linear;
  display: flex;
  align-items: center;
  justify-content: center;

  &,
  & > svg {
    width: 14px;
    height: 14px;
  }

  &.wide {
    &,
    & > svg {
      width: 18px;
      height: 18px;
    }
  }

  &.huge {
    &,
    & > svg {
      width: 30px;
      height: 30px;
    }
  }
`;

class LoadingCircle extends React.PureComponent<LoadingCircleProps> {
  render() {
    const { className, progress, bare, wide, huge } = this.props;

    return (
      <CircleContainer className={classNames(className, { bare, wide, huge })}>
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
  huge?: boolean;
}
