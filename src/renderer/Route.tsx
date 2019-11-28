import { Profile } from "common/butlerd/messages";
import { CurrentLocale } from "common/locales";
import { packets } from "common/packets";
import React, { createContext, useContext, useState } from "react";
import { useAsync } from "react-async-hook";
import { IntlProvider } from "react-intl";
import { App } from "renderer/App";
import { GamePage } from "renderer/pages/GamePage";
import { LibraryPage } from "renderer/pages/LibraryPage";
import { Socket, useListen } from "renderer/Socket";
import styled from "renderer/styles";
import { queries } from "../common/queries";

let firstMeaningfulRender = true;
let log = (...args: any[]) => {
  let d = new Date();
  console.log(
    `${d.getHours()}:${d.getMinutes()}:${d.getSeconds()}.${d.getMilliseconds()}`,
    ...args
  );
};

// TODO: do all that in renderer/index instead! so that the first
// meaningful render always has a socketa, and the context has to be non-null
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
  const [currentLocale, setCurrentLocale] = useState<CurrentLocale>({
    lang: "en",
    strings: {},
  });
  const [socket, setSocket] = useState<Socket | undefined>(undefined);
  const [profile, setProfile] = useState<Profile | undefined>(undefined);
  const [error, setError] = useState<String | undefined>(undefined);

  useAsync(async () => {
    if (socket) {
      return;
    }

    try {
      const SESSION_WS_KEY = "internal-websocket";

      let address = sessionStorage.getItem(SESSION_WS_KEY);
      if (!address) {
        log(`Fetching websocket addres...`);
        let res = await fetch("itch://api/websocket-address");
        log(`Fetching websocket addres...done`);
        let payload = await res.json();
        address = payload.address as string;
        sessionStorage.setItem(SESSION_WS_KEY, address);
      }

      log(`Connecting to WebSocket...`);
      let t1 = Date.now();
      let socket = await Socket.connect(address);
      let t2 = Date.now();
      log(`Connecting to WebSocket...done (took ${t2 - t1} ms)`);
      setSocket(socket);
    } catch (e) {
      console.error(e.stack);
      setError(e.stack);
    }
  }, []);

  useListen(socket, packets.profileChanged, ({ profile }) =>
    setProfile(profile)
  );

  useAsync(async () => {
    if (socket) {
      log(`Getting profile...`);
      const { profile } = await socket.query(queries.getProfile);
      log(`Getting profile...done`);
      setProfile(profile);
    } else {
      log(`Not getting current profile yet`);
    }
  }, [socket]);

  useListen(socket, packets.currentLocaleChanged, ({ currentLocale }) => {
    setCurrentLocale(currentLocale);
  });

  useAsync(async () => {
    if (socket) {
      log(`Getting current locale...`);
      const { currentLocale } = await socket.query(queries.getCurrentLocale);
      setCurrentLocale(currentLocale);
      log(`Getting current locale...done`);
    } else {
      log(`Not getting current locale yet`);
    }
  }, [socket]);

  if (socket && Object.keys(currentLocale.strings).length > 0) {
    if (firstMeaningfulRender) {
      firstMeaningfulRender = false;
      log(`First meaningful render!`);
    }
    let elements = [location.host, location.pathname.replace(/^\//, "")].filter(
      s => s.length > 0
    );
    return (
      <SocketContext.Provider value={socket}>
        <ProfileContext.Provider value={profile}>
          <IntlProvider
            locale={currentLocale.lang}
            messages={currentLocale.strings}
          >
            <RouteContentsDiv>
              <RouteContents elements={elements} />
            </RouteContentsDiv>
          </IntlProvider>
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
      return <div>Loading...</div>;
    }
  }
};
