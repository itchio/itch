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

  display: flex;
  flex-direction: column;
`;

const TitleBar = styled.div`
  font-size: 16px;

  height: 36px;
  line-height: 36px;
  vertical-align: middle;

  padding: 0 10px;
`;

const Controls = styled.div`
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  padding: 10px;
`;

const AddressBar = styled.div`
  border: 1px solid ${props => props.theme.inputBorder};
  padding: 0 10px;

  border-radius: 2px;
  height: 36px;
  line-height: 36px;
  vertical-align: middle;

  flex-grow: 1;
  max-width: 600px;
`;

export const Navigation = () => {
  return (
    <NavDiv>
      <TitleBar>Page title goes here</TitleBar>
      <Controls>
        <IconButton icon="arrow-left" />
        <IconButton icon="arrow-right" />
        <IconButton icon="repeat" />
        <AddressBar>Address</AddressBar>
      </Controls>
    </NavDiv>
  );
};

export const Webview = () => {
  return (
    <WebviewDiv>
      <Navigation />
      <webview src="itch://games/3" />
    </WebviewDiv>
  );
};
