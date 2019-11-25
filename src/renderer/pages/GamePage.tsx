import { messages } from "common/butlerd";
import React from "react";
import { Container } from "renderer/basics/Container";
import { Call } from "renderer/use-butlerd";
import { LoadingCircle } from "renderer/basics/LoadingCircle";

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
          location.replace(game.url);
          return <LoadingCircle progress={1} />;
          // return (
          //   <>
          //     <h2>{game.title}</h2>
          //     <img src={game.stillCoverUrl || game.coverUrl}></img>
          //     <p>{game.shortText}</p>
          //   </>
          // );
        }}
      />
    </Container>
  );
};
