import classNames from "classnames";
import React from "react";
import styled, { keyframes } from "renderer/styles";

const floaterKeyframes = keyframes`
  0% {
    transform: scale(0);
    opacity: .6;
  }

  100% {
    transform: scale(1);
    opacity: 1;
  }
`;

const numDrops = 3;
const duration = 0.5;
const offset = duration / numDrops;

const FloaterDiv = styled.div`
  width: 30px;
  height: 10px;

  display: flex;
  flex-flow: row;
  align-items: center;
  justify-content: center;

  div {
    width: 8px;
    height: 6px;
    margin: 0 2px;
    border-radius: 50%;
    background: white;
    animation: ${floaterKeyframes} ${duration}s infinite ease-in-out alternate;
  }

  &.tiny {
    width: 20px;
    height: 8px;

    div {
      width: 6px;
      height: 3px;
    }
  }

  div:nth-child(1) {
    animation-delay: -${offset * 2}s;
  }

  div:nth-child(2) {
    animation-delay: -${offset * 1}s;
  }
`;

export default function Floater(props: { tiny?: boolean }) {
  const { tiny } = props;
  return (
    <FloaterDiv className={classNames({ tiny })}>
      <div />
      <div />
      <div />
    </FloaterDiv>
  );
}
