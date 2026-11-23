import * as messages from "common/butlerd/messages";
import { ambientTab } from "common/util/navigation";
import React from "react";
import ErrorState from "renderer/basics/ErrorState";
import FiltersContainer from "renderer/basics/FiltersContainer";
import {
  dispatchTabEvolve,
  dispatchTabPageUpdate,
} from "renderer/hocs/tab-utils";
import { useAppDispatch, useAppSelector } from "renderer/hooks/redux";
import { useButlerd } from "renderer/hooks/useButlerd";
import { useTab } from "renderer/hooks/useTab";
import { MeatProps } from "renderer/scenes/HubScene/Meats/types";

const FetchGame = ({ gameId }: { gameId: number }) => {
  const tab = useTab();
  const dispatch = useAppDispatch();

  const { loading, error } = useButlerd(
    messages.FetchGame,
    { gameId },
    {
      onResult: ({ game }) => {
        if (game) {
          dispatchTabPageUpdate({ tab, dispatch }, { label: game.title });
          dispatchTabEvolve(
            { tab, dispatch },
            { replace: true, url: game.url, resource: `games/${game.id}` }
          );
        }
      },
    }
  );

  if (error) {
    return <ErrorState error={error} />;
  }
  return <FiltersContainer loading={loading} />;
};

const GamePage = (_props: MeatProps) => {
  const tab = useTab();
  const gameId = useAppSelector((rs) => {
    const id = ambientTab(rs, { tab }).location?.firstPathNumber;
    // NaN never equals itself, so it would rerender on every store update
    return Number.isNaN(id) ? undefined : id;
  });

  if (gameId === undefined) {
    return <ErrorState error={new Error("Missing game id in URL")} />;
  }
  return <FetchGame gameId={gameId} />;
};

export default GamePage;
