import { messages } from "common/butlerd";
import { packets } from "common/packets";
import React from "react";
import { Sidebar } from "renderer/App/Sidebar";
import { Webview } from "renderer/App/Webview";
import { useProfile, useSocket } from "renderer/Route";
import styled from "renderer/styles";
import { Call } from "renderer/use-butlerd";
import { useAsyncCallback, useAsync } from "react-async-hook";
import { queries } from "common/queries";
import { Gate } from "renderer/Gate";

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
  let socket = useSocket();
  let profile = useProfile();

  let login = useAsyncCallback(async profile => {
    await socket.query(queries.setProfile, { profile });
  });

  if (!profile) {
    return <Gate />;
  }

  return (
    <AppDiv>
      <Sidebar />
      <MainDiv>
        <Webview />
      </MainDiv>
    </AppDiv>
  );
};
