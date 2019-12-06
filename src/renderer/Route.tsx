import { Profile } from "common/butlerd/messages";
import { packets } from "common/packets";
import React, { useState } from "react";
import { useAsync } from "react-async-hook";
import { ProfileContext, useSocket } from "renderer/contexts";
import { useListen } from "renderer/Socket";
import styled from "styled-components";
import { queries } from "../common/queries";

const App = React.lazy(() => import("renderer/Shell"));
const LibraryPage = React.lazy(() => import("renderer/pages/LibraryPage"));
const GamePage = React.lazy(() => import("renderer/pages/GamePage"));

let firstMeaningfulRender = true;
let log = (...args: any[]) => {
  let d = new Date();
  console.log(
    `${d.getHours()}:${d.getMinutes()}:${d.getSeconds()}.${d.getMilliseconds()}`,
    ...args
  );
};

const RouteContentsDiv = styled.div`
  background: ${p => p.theme.colors.shellBg};

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
  const socket = useSocket();
  const [profile, setProfile] = useState<Profile | undefined>(undefined);

  useListen(socket, packets.profileChanged, ({ profile }) =>
    setProfile(profile)
  );

  useAsync(async () => {
    const { profile } = await socket.query(queries.getProfile);
    setProfile(profile);
  }, [socket]);

  if (firstMeaningfulRender) {
    firstMeaningfulRender = false;
    log(`First meaningful render!`);
  }
  let elements = [location.host, location.pathname.replace(/^\//, "")].filter(
    s => s.length > 0
  );

  if (profile || elements[0] === "app") {
    return (
      <ProfileContext.Provider value={profile}>
        <RouteContentsDiv>
          <RouteContents elements={elements} />
        </RouteContentsDiv>
      </ProfileContext.Provider>
    );
  } else {
    return <div>...</div>;
  }
};
