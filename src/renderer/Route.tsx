import React from "react";
import dump from "common/util/dump";
import { App } from "renderer/App";
import { GamePage } from "renderer/pages/GamePage";
import styled from "renderer/styles";

const ErrorDiv = styled.div`
  background: black;
  padding: 4px;
  color: red;
  font-weight: bold;
  font-size: 30px;
  border: 2px solid;
`;

export const Route = () => {
  let elements = [location.host, location.pathname.replace(/^\//, "")].filter(
    s => s.length > 0
  );

  switch (elements[0]) {
    case "app":
      return <App />;
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
            <a href="itch://app">Go back to home</a>
          </p>
        </ErrorDiv>
      );
  }
};
