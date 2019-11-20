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
  const [error, setError] = useState<String>(null);

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
        address = payload.address;
        sessionStorage.setItem(SESSION_WS_KEY, address);
      } else {
        console.log(`Using cached websocket address`);
      }

      let socket = new WebSocket(address);
      socket.onopen = () => {
        socket.send("hello from Route");
        setSocket(socket);
      };
    })().catch(e => {
      console.error(e.stack);
      setError(e.stack);
    });
  });

  if (socket) {
    let elements = [location.host, location.pathname.replace(/^\//, "")].filter(
      s => s.length > 0
    );
    return <RouteContents elements={elements} />;
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
