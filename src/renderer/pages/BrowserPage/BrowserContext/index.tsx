import * as messages from "common/butlerd/messages";
import { ambientTab } from "common/util/navigation";
import React from "react";
import ErrorState from "renderer/basics/ErrorState";
import LoadingState from "renderer/basics/LoadingState";
import { useAppSelector } from "renderer/hooks/redux";
import { useButlerd } from "renderer/hooks/useButlerd";
import { useTab } from "renderer/hooks/useTab";
import { browserContextHeight } from "renderer/pages/BrowserPage/BrowserContext/BrowserContextConstants";
import BrowserContextGame from "renderer/pages/BrowserPage/BrowserContext/BrowserContextGame";
import styled from "renderer/styles";

const BrowserContextContainer = styled.div`
  height: ${browserContextHeight}px;

  display: flex;
  flex-direction: column;
  justify-content: center;
`;

const FetchedGame = ({ gameId }: { gameId: number }) => {
  const tab = useTab();
  const sequence = useAppSelector((rs) => ambientTab(rs, { tab }).sequence);
  const { loading, error, result } = useButlerd(
    messages.FetchGame,
    { gameId },
    { sequence }
  );

  if (loading && !result) {
    return <LoadingState />;
  }
  if (error) {
    return <ErrorState error={error} />;
  }
  if (!result?.game) {
    return null;
  }
  return <BrowserContextGame game={result.game} />;
};

const BrowserContext = () => {
  const tab = useTab();
  const gameId = useAppSelector((rs) => {
    const { resource } = ambientTab(rs, { tab });
    if (resource && resource.prefix === "games") {
      // also turns NaN into null, see hooks/README.md
      return resource.numericId || null;
    }
    return null;
  });

  if (!gameId) {
    return null;
  }
  return (
    <BrowserContextContainer>
      <FetchedGame key={gameId} gameId={gameId} />
    </BrowserContextContainer>
  );
};

export default BrowserContext;
