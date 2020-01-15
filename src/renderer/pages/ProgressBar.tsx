import React from "react";
import styled from "styled-components";
import classNames from "classnames";

const bgDark = "#555";
const bgLite = "#eee";

const ProgressBarDiv = styled.div`
  position: relative;
  overflow: hidden;

  width: 100px;
  height: 6px;
  border-radius: 3px;
  background: ${bgDark};
  border: 1px solid ${bgLite};

  .inner {
    position: absolute;
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
    background: ${bgLite};
  }
`;

interface Props {
  progress: number;
  className?: string;
}

export const ProgressBar = (props: Props) => {
  const { className } = props;
  const progress = Math.max(0, Math.min(props.progress, 1.0));

  return (
    <ProgressBarDiv className={classNames("progress-bar", "outer", className)}>
      <div className="inner" style={{ right: `${100 * (1 - progress)}%` }} />
    </ProgressBarDiv>
  );
};
