import { messages } from "common/butlerd";
import React from "react";
import styled from "renderer/styles";
import { Call } from "renderer/use-butlerd";

const Title = styled.h2`
  font-size: 24px;
  font-weight: bold;
`;

const Container = styled.div`
  padding: 20px;
  line-height: 1.6;
`;

interface Props {
  gameId: number;
}

export const GamePage = ({ gameId }: Props) => {
  return (
    <Container>
      <Call
        rc={messages.FetchGame}
        params={{ gameId }}
        render={({ game }) => {
          return (
            <>
              <Title>{game.title}</Title>
              <img src={game.stillCoverUrl || game.coverUrl}></img>
              <p>{game.shortText}</p>
            </>
          );
        }}
      />
    </Container>
  );
};
