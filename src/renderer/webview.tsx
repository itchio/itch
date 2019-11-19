import React from "react";
import styled from "renderer/styles";
import IconButton from "renderer/basics/IconButton";

const WebviewDiv = styled.div`
  width: 100%;
  height: 100%;

  webview {
    width: 100%;
    height: 100%;
  }
`;

const NavDiv = styled.div`
  color: ${props => props.theme.baseText};
`;

export const Navigation = () => {
  return (
    <NavDiv>
      <span>Go Back</span>
      <span>Forward</span>
      <span>Reload</span>
      <IconButton icon="repeat" />
      <span>Address</span>
    </NavDiv>
  );
};

export const Webview = () => {
  return (
    <WebviewDiv>
      <Navigation />
      <webview src="https://itch.io" />
    </WebviewDiv>
  );
};
