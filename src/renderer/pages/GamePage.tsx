import { messages } from "common/butlerd";
import React from "react";
import { ErrorState } from "renderer/basics/ErrorState";
import { LoadingCircle } from "renderer/basics/LoadingCircle";
import styled from "renderer/styles";
import { useButlerd, Call } from "renderer/use-butlerd";

const Container = styled.div`
  padding: 20px;
  line-height: 1.6;
`;

interface Props {
  gameId: number;
}

export const GamePage = ({ gameId }: Props) => {
  return (
    <Call
      rc={messages.FetchGame}
      params={{ gameId }}
      render={({ game }) => {
        return (
          <Container>
            <img src={game.stillCoverUrl || game.coverUrl}></img>
            <p>Should show game {gameId}</p>
            <p>
              Back to library: <a href="itch://library">Library</a>
            </p>
          </Container>
        );
      }}
    />
  );
};
