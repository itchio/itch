import { messages } from "common/butlerd";
import { packets } from "common/packets";
import React from "react";
import { Sidebar } from "renderer/App/Sidebar";
import { Webview } from "renderer/App/Webview";
import { useProfile, useSocket } from "renderer/Route";
import styled from "renderer/styles";
import { Call } from "renderer/use-butlerd";

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

  if (!profile) {
    return (
      <Call
        rc={messages.ProfileList}
        params={{}}
        render={({ profiles }) => {
          return (
            <ul>
              {profiles.map(profile => (
                <li
                  key={profile.id}
                  style={{
                    padding: "30px",
                    fontSize: "24px",
                    margin: "30px",
                    border: "1px solid #ccc",
                    borderRadius: "4px",
                  }}
                  onClick={() => socket!.send(packets.setProfile, { profile })}
                >
                  {profile.user.displayName || profile.user.username}
                </li>
              ))}
            </ul>
          );
        }}
      />
    );
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
