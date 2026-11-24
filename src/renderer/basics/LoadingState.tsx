import React from "react";
import Floater from "renderer/basics/Floater";
import styled from "renderer/styles";

export const LoadingStateDiv = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 20px auto;
`;

const LoadingState = () => (
  <LoadingStateDiv>
    <Floater />
  </LoadingStateDiv>
);

export default LoadingState;
