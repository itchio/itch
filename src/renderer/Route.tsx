import { Profile } from "common/butlerd/messages";
import { packets } from "common/packets";
import React, { createContext, useContext, useEffect, useState } from "react";
import { App } from "renderer/App";
import { GamePage } from "renderer/pages/GamePage";
import { LibraryPage } from "renderer/pages/LibraryPage";
import { Cancel, Socket } from "renderer/Socket";
import styled from "renderer/styles";

export const SocketContext = createContext<Socket | undefined>(undefined);
export const ProfileContext = createContext<Profile | undefined>(undefined);

export const useSocket = () => useContext(SocketContext);
export const useProfile = () => useContext(ProfileContext);

const RouteContentsDiv = styled.div`
  background: ${props => props.theme.breadBackground};

  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  overflow-y: auto;
`;

const ErrorDiv = styled.div`
  background: black;
  padding: 4px;
  color: red;
  font-weight: bold;
  font-size: 30px;
  border: 2px solid;
`;

export const RouteContents = (props: { elements: string[] }) => {
  const { elements } = props;
  switch (elements[0]) {
    case "app":
      return <App />;
    case "featured":
      location.replace("https://itch.io/");
      return <div />;
    case "library":
      return <LibraryPage />;
    case "games":
      const gameId = parseInt(elements[1], 10);
      return <GamePage gameId={gameId} />;
    default:
      return (
        <ErrorDiv>
          <p>
            Page not found: <code>itch://{elements.join("/")}</code>
          </p>
          <p>
            <a href="itch://library">Go back to home</a>
          </p>
        </ErrorDiv>
      );
  }
};

export const Route = () => {
  const [socket, setSocket] = useState<Socket | undefined>(undefined);
  const [profile, setProfile] = useState<Profile | undefined>(undefined);
  const [error, setError] = useState<String | undefined>(undefined);

  useEffect(() => {
    if (socket) {
      return;
    }

    (async () => {
      const SESSION_WS_KEY = "internal-websocket";

      let address = sessionStorage.getItem(SESSION_WS_KEY);
      if (!address) {
        console.log(`Finding out websocket address`);
        let res = await fetch("itch://api/websocket-address");
        let payload = await res.json();
        address = payload.address as string;
        sessionStorage.setItem(SESSION_WS_KEY, address);
      } else {
        console.log(`Using cached websocket address`);
      }

      let socket = await Socket.connect(address);
      socket.listen(packets.tick, ({ time }) => {
        console.log("tick! time = ", time);
      });
      setSocket(socket);
    })().catch(e => {
      console.error(e.stack);
      setError(e.stack);
    });
  });

  useEffect(() => {
    if (!socket) {
      return;
    }

    let cancels: Cancel[] = [];
    cancels.push(
      socket.listen(packets.getProfileResult, ({ profile }) => {
        setProfile(profile);
      })
    );
    cancels.push(
      socket.listen(packets.setProfile, ({ profile }) => {
        setProfile(profile);
      })
    );
    // TODO: better one-off requests
    socket.send(packets.getProfile, {});
    return () => {
      for (let c of cancels) {
        c();
      }
    };
  }, [socket]);

  if (socket) {
    let elements = [location.host, location.pathname.replace(/^\//, "")].filter(
      s => s.length > 0
    );
    return (
      <SocketContext.Provider value={socket}>
        <ProfileContext.Provider value={profile}>
          <RouteContentsDiv>
            <RouteContents elements={elements} />
          </RouteContentsDiv>
        </ProfileContext.Provider>
      </SocketContext.Provider>
    );
  } else {
    if (error) {
      return (
        <pre>
          Something went wrong:
          {error}
        </pre>
      );
    } else {
      return <div />;
    }
  }
};
