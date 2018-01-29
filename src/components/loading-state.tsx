import * as React from "react";

import styled from "./styles";
import format from "./format";
import LoadingCircle from "./basics/loading-circle";

const LoadingStateContainer = styled.div`
  display: flex;
  width: 100%;
  height: 100%;
  align-items: center;
  overflow: hidden;
`;

const LoadingStateDiv = styled.div`
  width: 100%;
  text-align: center;
  font-size: ${props => props.theme.fontSizes.huge};
`;

export default class LoadingState extends React.PureComponent<IProps> {
  render() {
    return (
      <LoadingStateContainer>
        <LoadingStateDiv>
          <LoadingCircle progress={-1} wide />
          {format(["sidebar.loading"])}
        </LoadingStateDiv>
      </LoadingStateContainer>
    );
  }
}

interface IProps {}
