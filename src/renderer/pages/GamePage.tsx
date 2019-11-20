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
        Navigate to <a href="itch://games/5">game 5</a>
      </p>
      <p>
        Navigate to <a href="itch://games/12">game 12</a>
      </p>
    </Container>
  );
};
