import React, { useState, useEffect } from "react";
import { App } from "renderer/App";
import { GamePage } from "renderer/pages/GamePage";
import styled from "renderer/styles";
import { Socket } from "renderer/Socket";
import { packets } from "packets";

const RouteContentsDiv = styled.div`
  background: ${props => props.theme.breadBackground};

  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
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
  const [socket, setSocket] = useState<Socket | null>(null);
  const [error, setError] = useState<String | null>(null);

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

  if (socket) {
    let elements = [location.host, location.pathname.replace(/^\//, "")].filter(
      s => s.length > 0
    );
    return (
      <RouteContentsDiv>
        <RouteContents elements={elements} />
      </RouteContentsDiv>
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
