import { messages } from "common/butlerd";
import React from "react";
import styled from "renderer/styles";
import { Call } from "renderer/use-butlerd";

const Container = styled.div`
  padding: 20px;
  line-height: 1.6;
`;

export const LibraryPage = () => {
  return (
    <Call
      rc={messages.VersionGet}
      params={{}}
      render={({ versionString }) => (
        <Container>
          <p>Here's your library! We're using butler {versionString}</p>
          <p>
            Navigate to <a href="itch://games/3">game 3</a>
          </p>
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
      )}
    />
  );
};
