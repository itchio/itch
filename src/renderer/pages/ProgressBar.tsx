import React from "react";
import styled from "styled-components";

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
}

export const ProgressBar = (props: Props) => {
  return (
    <ProgressBarDiv className="progress-bar outer">
      <div
        className="inner"
        style={{ right: `${100 * (1 - props.progress)}%` }}
      />
    </ProgressBarDiv>
  );
};
