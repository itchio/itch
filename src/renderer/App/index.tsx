import React, { useState, useEffect } from "react";
import styled from "renderer/styles";
import { Sidebar } from "renderer/App/Sidebar";
import { Webview } from "renderer/App/Webview";

const AppDiv = styled.div`
  background: ${props => props.theme.baseBackground};
  display: flex;
  flex-direction: row;

  position: absolute;
  top: 0;
  left: 0;
  bottom: 0;
  right: 0;
  overflow: hidden;
`;

const MainDiv = styled.div`
  flex-grow: 1;
`;

export const App = () => {
  return (
    <AppDiv
      onClickCapture={ev => {
        const target = ev.target as HTMLElement;
        if (target.tagName == "A") {
          ev.preventDefault();
        }
      }}
    >
      <Sidebar />
      <MainDiv>
        <Webview />
      </MainDiv>
    </AppDiv>
  );
};
