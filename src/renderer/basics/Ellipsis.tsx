import React from "react";
import styled from "styled-components";

const EllipsisDiv = styled.div`
  & {
    display: inline-block;
    position: relative;
    width: 1em;
    height: 1em;
    overflow: visible;
    transform: scale(0.4);
  }

  div {
    position: absolute;
    top: 50%;
    margin-top: -7px;
    width: 14px;
    height: 14px;
    border-radius: 50%;
    background: #fff;
    animation-timing-function: cubic-bezier(0, 1, 1, 0);

    &:nth-child(1) {
      left: 8px;
      animation: lds-ellipsis1 0.6s infinite;
    }
    &:nth-child(2) {
      left: 8px;
      animation: lds-ellipsis2 0.6s infinite;
    }
    &:nth-child(3) {
      left: 32px;
      animation: lds-ellipsis2 0.6s infinite;
    }
    &:nth-child(4) {
      left: 56px;
      animation: lds-ellipsis3 0.6s infinite;
    }
  }

  @keyframes lds-ellipsis1 {
    0% {
      transform: scale(0);
    }
    100% {
      transform: scale(1);
    }
  }

  @keyframes lds-ellipsis3 {
    0% {
      transform: scale(1);
    }
    100% {
      transform: scale(0);
    }
  }

  @keyframes lds-ellipsis2 {
    0% {
      transform: translate(0, 0);
    }
    100% {
      transform: translate(24px, 0);
    }
  }
`;

export const Ellipsis = () => {
  return (
    <EllipsisDiv className="ellipsis">
      <div></div>
      <div></div>
      <div></div>
      <div></div>
    </EllipsisDiv>
  );
};
