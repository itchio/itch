import { actions } from "common/actions";
import * as messages from "common/butlerd/messages";
import { ambientTab } from "common/util/navigation";
import React from "react";
import ErrorState from "renderer/basics/ErrorState";
import FiltersContainer from "renderer/basics/FiltersContainer";
import { dispatchTabEvolve } from "renderer/hocs/tab-utils";
import { useAppDispatch, useAppSelector } from "renderer/hooks/redux";
import { useButlerd } from "renderer/hooks/useButlerd";
import { useTab } from "renderer/hooks/useTab";
import { MeatProps } from "renderer/scenes/HubScene/Meats/types";

const LaunchCave = ({ caveId }: { caveId: string }) => {
  const tab = useTab();
  const dispatch = useAppDispatch();

  const { loading, error } = useButlerd(
    messages.FetchCave,
    { caveId },
    {
      onResult: ({ cave }) => {
        if (cave && cave.game) {
          dispatch(actions.queueLaunch({ cave }));
          dispatchTabEvolve(
            { tab, dispatch },
            {
              replace: true,
              url: cave.game.url,
              resource: `games/${cave.game.id}`,
            }
          );
        } else {
          // TODO: handle caves not found, etc.
        }
      },
    }
  );

  if (error) {
    return <ErrorState error={error} />;
  }
  return <FiltersContainer loading={loading} />;
};

const CavePage = (_props: MeatProps) => {
  const tab = useTab();
  const caveId = useAppSelector(
    (rs) => ambientTab(rs, { tab }).location?.firstPathElement
  );

  if (!caveId) {
    return <ErrorState error={new Error("Missing cave id in URL")} />;
  }
  return <LaunchCave caveId={caveId} />;
};

export default CavePage;
