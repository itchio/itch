import React, { useState, useEffect } from "react";
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

export const RouteContents = (props: { elements: string[] }) => {
  const { elements } = props;
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

export const Route = () => {
  const [socket, setSocket] = useState<WebSocket>(null);

  useEffect(() => {
    if (socket) {
      return;
    }

    fetch("itch://api/ws")
      .then(res => res.json())
      .then(res => {
        console.log("Got ws address!", res);
        let { address, port } = res.websocket;
        let wsUrl = `ws://${address}:${port}`;
        let ws = new WebSocket(wsUrl);
        ws.onopen = () => {
          ws.send("hello from Route");
          setSocket(ws);
        };
      });
  });

  if (socket) {
    let elements = [location.host, location.pathname.replace(/^\//, "")].filter(
      s => s.length > 0
    );
    return <RouteContents elements={elements} />;
  } else {
    return <div />;
  }
};
