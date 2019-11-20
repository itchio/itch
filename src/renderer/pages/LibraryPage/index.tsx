import React from "react";
import styled from "renderer/styles";

const Container = styled.div`
  padding: 20px;
  line-height: 1.6;
`;

export const LibraryPage = (props: {}) => {
  return (
    <Container>
      <p>Here's your library</p>
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
