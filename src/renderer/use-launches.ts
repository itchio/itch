import { OngoingLaunches, OngoingLaunch } from "common/launches";
import { useSocket } from "renderer/contexts";
import { useState, useEffect } from "react";
import { queries } from "common/queries";
import { useListen } from "renderer/Socket";
import { packets } from "common/packets";
import _ from "lodash";
import { filterObject } from "common/filter-object";

export type LaunchFilter = (launch: OngoingLaunch) => boolean;

const noFilter = () => true;

/**
 * Return ongoing launches, optionally filtered by something
 */
export function useLaunches(filter: LaunchFilter = noFilter): OngoingLaunches {
  const [launches, setLaunches] = useState<OngoingLaunches>({});
  const mergeLaunches = (fresh: OngoingLaunches) => {
    setLaunches(old => ({
      ...old,
      ...filterObject(fresh, filter),
    }));
  };

  const socket = useSocket();
  useEffect(() => {
    async () => {
      const { launches } = await socket.query(queries.getOngoingLaunches);
      mergeLaunches(launches);
    };
  }, []);
  useListen(
    socket,
    packets.launchChanged,
    ({ launchId, launch }) => {
      mergeLaunches({ [launchId]: launch });
    },
    []
  );
  useListen(
    socket,
    packets.launchEnded,
    ({ launchId }) => {
      setLaunches(old => (old[launchId] ? _.omit(old, launchId) : old));
    },
    []
  );

  return launches;
}
