import { filterObject } from "common/filter-object";
import { OngoingLaunch, OngoingLaunches } from "common/launches";
import { packets } from "common/packets";
import { queries } from "common/queries";
import _ from "lodash";
import { useState } from "react";
import { useListen } from "renderer/Socket";
import { useAsync } from "renderer/use-async";
import { socket } from "renderer";

export interface LaunchFilter {
  gameId?: number;
}

function applyFilter(l: OngoingLaunch, filter?: LaunchFilter): boolean {
  if (filter?.gameId) {
    return l.gameId == filter.gameId;
  } else {
    return true;
  }
}

/**
 * Return ongoing launches, optionally filtered by something
 */
export function useLaunches(filter?: LaunchFilter): OngoingLaunches {
  const filterState = JSON.stringify(filter);

  const [launches, setLaunches] = useState<OngoingLaunches>({});
  const mergeLaunches = (fresh: OngoingLaunches) => {
    setLaunches((old) => ({
      ...old,
      ...filterObject(fresh, (l) => applyFilter(l, filter)),
    }));
  };

  useAsync(
    async () => {
      const { launches } = await socket.query(queries.getOngoingLaunches);
      mergeLaunches(launches);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [socket, filterState]
  );

  useListen(
    socket,
    packets.launchChanged,
    ({ launchId, launch }) => {
      mergeLaunches({ [launchId]: launch });
    },
    [filterState]
  );
  useListen(
    socket,
    packets.launchEnded,
    ({ launchId }) => {
      setLaunches((old) => (old[launchId] ? _.omit(old, launchId) : old));
    },
    [filterState]
  );

  return launches;
}
