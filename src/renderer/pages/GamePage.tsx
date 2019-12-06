import { messages } from "common/butlerd";
import React from "react";
import { LoadingCircle } from "renderer/basics/LoadingCircle";
import { Call } from "renderer/use-butlerd";
import styled from "styled-components";

interface Props {
  gameId: number;
}

const CenterHV = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;

  height: 100vh;
`;

export const GamePage = ({ gameId }: Props) => {
  return (
    <CenterHV>
      <Call
        rc={messages.FetchGame}
        params={{ gameId }}
        render={({ game }) => {
          location.replace(game.url);
          return <LoadingCircle progress={0.3} huge />;
        }}
      />
    </CenterHV>
  );
};

export default GamePage;
