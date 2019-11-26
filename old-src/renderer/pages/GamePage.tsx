import { messages } from "common/butlerd";
import React from "react";
import { LoadingCircle } from "renderer/basics/LoadingCircle";
import styled from "renderer/styles";
import { Call } from "renderer/use-butlerd";

interface Props {
  gameId: number;
}

const CenterCenter = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;

  height: 100vh;
`;

export const GamePage = ({ gameId }: Props) => {
  return (
    <CenterCenter>
      <Call
        rc={messages.FetchGame}
        params={{ gameId }}
        render={({ game }) => {
          location.replace(game.url);
          return <LoadingCircle progress={0.3} huge />;
        }}
      />
    </CenterCenter>
  );
};
