import classNames from "classnames";
import React, { useEffect, useState } from "react";
import { Circle } from "renderer/basics/LoadingCircle/Circle";
import { animations } from "renderer/theme";
import styled from "styled-components";

const CircleContainer = styled.span`
  &.spinning {
    animation: ${animations.spinner} linear infinite 2s;
  }

  display: inline;

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

interface LoadingCircleProps {
  className?: string;
  progress: number;
  bare?: boolean;
  wide?: boolean;
  huge?: boolean;
}

export const LoadingCircle = (props: LoadingCircleProps) => {
  const { className, progress, bare, wide, huge } = props;

  const percent = progress > 0 ? progress * 100.0 : 100 / 3;
  const [shownPercent, setShownPercent] = useState(0);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    interval = setInterval(() => {
      if (Math.abs(shownPercent - percent) < 1) {
        clearInterval(interval);
      }
      setShownPercent(percent * 0.5 + shownPercent * 0.5);
    }, 100);
    return () => clearInterval(interval);
  }, [percent]);

  return (
    <CircleContainer
      className={classNames(className, {
        bare,
        wide,
        huge,
        spinning: !(progress > 0),
      })}
    >
      <Circle
        percent={shownPercent}
        trailWidth={3}
        trailColor="#e0e0e2"
        strokeWidth={15}
        strokeColor="white"
      />
    </CircleContainer>
  );
};

const SpinningCircle = styled(LoadingCircle)`
  animation: ${animations.spinner} linear infinite 2s;
`;

export const Spinner = () => {
  return <SpinningCircle className="spinner" progress={0.3} wide />;
};

const FullScreenSpinnerContainer = styled.div`
  min-height: 200px;

  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
`;

export const FullScreenSpinner = () => {
  return (
    <FullScreenSpinnerContainer>
      <SpinningCircle className="spinner" progress={0.3} wide />
    </FullScreenSpinnerContainer>
  );
};
