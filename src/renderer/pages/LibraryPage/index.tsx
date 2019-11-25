import { messages } from "common/butlerd";
import React from "react";
import styled from "renderer/styles";
import { useButlerd } from "renderer/use-butlerd";

const Container = styled.div`
  padding: 20px;
  line-height: 1.6;
`;

export const LibraryPage = (props: {}) => {
  const version = useButlerd(messages.VersionGet, {});

  return (
    <Container>
      <p>
        Here's your library! We're using butler{" "}
        {version.loading ? "..." : version.result!.versionString}
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
  );
};
