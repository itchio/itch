import { Profile } from "@itchio/valet/messages";
import { packets } from "common/packets";
import React, { useEffect, useState } from "react";
import { OptionalProfileContext } from "renderer/contexts";
import { ModalRouter } from "renderer/modals/ModalRouter";
import { useListen } from "renderer/Socket";
import { fontSizes } from "renderer/theme";
import styled from "styled-components";
import { queries } from "../common/queries";
import { socket } from "renderer";

const App = React.lazy(() => import("renderer/Shell"));
const GamePage = React.lazy(() => import("renderer/pages/GamePage"));

const RouteContentsDiv = styled.div`
  background: ${(p) => p.theme.colors.shellBg};

  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  overflow-y: auto;
`;

const ErrorDiv = styled.div`
  padding: 30px;
  font-size: ${fontSizes.large};
  line-height: 1.6;
`;

export const RouteContents = (props: { elements: string[] }) => {
  const { elements } = props;
  switch (elements[0]) {
    case "app":
      return <App />;
    case "modal":
      return <ModalRouter />;
    case "featured":
      location.replace("https://itch.io/");
      return <div />;
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
            <a href="https://itch.io">Go back</a>
          </p>
        </ErrorDiv>
      );
  }
};

export const Route = () => {
  const [profile, setProfile] = useState<Profile | undefined>(undefined);

  useListen(
    socket,
    packets.profileChanged,
    ({ profile }) => setProfile(profile),
    []
  );

  useEffect(() => {
    (async () => {
      const { profile } = await socket.query(queries.getProfile);
      setProfile(profile);
    })().catch((e) => console.warn(e));
  }, []);

  let elements = [location.host, location.pathname.replace(/^\//, "")].filter(
    (s) => s.length > 0
  );

  if (profile || elements[0] === "app") {
    return (
      <OptionalProfileContext.Provider value={profile}>
        <RouteContentsDiv>
          <RouteContents elements={elements} />
        </RouteContentsDiv>
      </OptionalProfileContext.Provider>
    );
  } else {
    return <div>...</div>;
  }
};
