import * as messages from "common/butlerd/messages";
import { ModalWidgetProps } from "common/modals";
import { ConfirmQuitParams, ConfirmQuitResponse } from "common/modals/types";
import React from "react";
import ErrorState from "renderer/basics/ErrorState";
import LoadingState from "renderer/basics/LoadingState";
import { useButlerd } from "renderer/hooks/useButlerd";
import { ModalWidgetDiv } from "renderer/modal-widgets/styles";
import { FilterSpacer } from "renderer/pages/common/SortsAndFilters";
import StandardGameCover from "renderer/pages/common/StandardGameCover";
import StandardGameDesc from "renderer/pages/common/StandardGameDesc";
import { Box, BoxInner } from "renderer/pages/PageStyles/boxes";

const RunningGame = ({ gameId }: { gameId: number }) => {
  const { loading, result, error } = useButlerd(messages.FetchGame, {
    gameId,
  });

  // a cached game stays up even if refreshing it failed
  const game = result?.game;
  if (game) {
    return (
      <Box>
        <BoxInner>
          <StandardGameCover game={game} disableLink />
          <FilterSpacer />
          <StandardGameDesc game={game} disableLink />
          <FilterSpacer />
        </BoxInner>
      </Box>
    );
  }

  if (error) {
    return <ErrorState error={error} />;
  }

  if (loading) {
    return <LoadingState />;
  }

  return null;
};

type Props = ModalWidgetProps<ConfirmQuitParams, ConfirmQuitResponse>;

const ConfirmQuit = ({ modal }: Props) => {
  const { gameIds } = modal.widgetParams;

  return (
    <ModalWidgetDiv>
      {gameIds.map((gameId) => (
        <RunningGame gameId={gameId} key={gameId} />
      ))}
    </ModalWidgetDiv>
  );
};

export default ConfirmQuit;
