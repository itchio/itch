import React, { useContext, useState, useEffect } from "react";
import styled from "renderer/styles";
import { SocketContext } from "renderer/Route";
import { messages } from "common/butlerd";

const Container = styled.div`
  padding: 20px;
  line-height: 1.6;
`;

export const LibraryPage = (props: {}) => {
  const socket = useContext(SocketContext);
  const [version, setVersion] = useState("??");

  useEffect(() => {
    if (!socket) {
      return;
    }

    console.log("Got socket, oh yes");
    (async () => {
      const res = await socket.call(messages.VersionGet, {});
      console.log("res = ", res);
      setVersion(res.versionString);
    })();
  }, [socket]);

  return (
    <Container>
      <p>Here's your library! We're using butler {version}</p>
      <p>
        Navigate to <a href="itch://games/5">game 5</a>
      </p>
      <p>
        Navigate to <a href="itch://games/12">game 12</a>
      </p>
      <p>
        Navigate to <a href="https://itch.io">the itch homepage</a>
      </p>
    </Container>
  );
};
