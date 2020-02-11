import classNames from "classnames";
import { messages } from "common/butlerd";
import { modals } from "common/modals";
import { queries } from "common/queries";
import _ from "lodash";
import React, { useCallback } from "react";
import { FormattedMessage } from "react-intl";
import { Button } from "renderer/basics/Button";
import { useSocket } from "renderer/contexts";
import { useAsyncCb } from "renderer/use-async-cb";
import { useLaunches } from "renderer/use-launches";

interface HighLevelProps {
  gameId: number;
  className?: string;
  wide?: boolean;
}

type LowLevelProps = HighLevelProps & {
  launch: (gameId: number) => Promise<void>;
  forceClose: (gameId: number) => Promise<void>;
  beingLaunched?: boolean;
};

export const LaunchButtonBase = (props: LowLevelProps) => {
  const {
    beingLaunched,
    launch,
    forceClose,
    gameId,
    className,
    ...rest
  } = props;
  const click = useCallback(() => {
    if (beingLaunched) {
      forceClose(gameId);
    } else {
      launch(gameId);
    }
  }, [beingLaunched, launch, forceClose, gameId]);

  return (
    <>
      <Button
        className={classNames(
          beingLaunched ? "force-close-button" : "launch-button",
          className
        )}
        label={
          <FormattedMessage
            id={beingLaunched ? "grid.item.running" : "grid.item.launch"}
          />
        }
        secondary={beingLaunched}
        onClick={click}
        {...rest}
      />
    </>
  );
};

export const LaunchButton = (props: HighLevelProps) => {
  const { gameId } = props;

  const socket = useSocket();
  const launches = useLaunches({ gameId });

  const currentLaunchId = _.first(_.keys(launches));

  const [launch] = useAsyncCb(
    async (gameId: number) => {
      await socket.query(queries.launchGame, { gameId });
    },
    [socket, gameId]
  );

  const [forceClose] = useAsyncCb(
    async (gameId: number) => {
      if (!currentLaunchId) {
        return;
      }

      const { game } = await socket.call(messages.FetchGame, { gameId });
      if (!game) {
        console.warn(
          `Could not force close because game ${gameId} can't be fetched`
        );
        return;
      }

      await socket.showModal(modals.forceClose, {
        game,
        launchId: currentLaunchId,
      });
    },
    [socket, gameId, currentLaunchId]
  );

  return (
    <LaunchButtonBase
      {...props}
      forceClose={forceClose}
      launch={launch}
      beingLaunched={!!currentLaunchId}
    />
  );
};
