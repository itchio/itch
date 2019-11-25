import React, { useState, useEffect, useContext } from "react";
import styled from "renderer/styles";
import { Sidebar } from "renderer/App/Sidebar";
import { Webview } from "renderer/App/Webview";
import { SocketContext, ProfileContext } from "renderer/Route";
import { packets } from "packets";
import { Call } from "renderer/use-butlerd";
import { messages } from "common/butlerd";
import dump from "common/util/dump";

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
  let socket = useContext(SocketContext);
  let profile = useContext(ProfileContext);

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
    <AppDiv
      // TODO: use will-navigate instead
      onClickCapture={ev => {
        const target = ev.target as HTMLElement;
        if (target.tagName == "A") {
          ev.preventDefault();
          if (socket) {
            socket.send(packets.navigate, {
              href: (target as HTMLLinkElement).href,
            });
          }
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
