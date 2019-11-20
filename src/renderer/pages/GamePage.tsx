import React from "react";
import styled from "renderer/styles";

const Container = styled.div`
  padding: 20px;
  line-height: 1.6;
`;

export const GamePage = (props: { gameId: number }) => {
  return (
    <Container>
      <p>Should show game {props.gameId}</p>
      <p>
        Back to library: <a href="itch://library">Library</a>
      </p>
    </Container>
  );
};
