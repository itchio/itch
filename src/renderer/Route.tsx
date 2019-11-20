import React from "react";
import dump from "common/util/dump";
import { App } from "renderer/App";
import { GamePage } from "renderer/pages/GamePage";

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
      return <div>Should render elements {dump(elements)}</div>;
  }
};
