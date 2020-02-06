import classNames from "classnames";
import { Game } from "common/butlerd/messages";
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
  game: Game;
  className?: string;
  wide?: boolean;
}

type LowLevelProps = HighLevelProps & {
  launch: (game: Game) => Promise<void>;
  forceClose: (game: Game) => Promise<void>;
  beingLaunched?: boolean;
};

export const LaunchButtonBase = (props: LowLevelProps) => {
  const { beingLaunched, launch, forceClose, game, className, ...rest } = props;
  const click = useCallback(() => {
    if (beingLaunched) {
      forceClose(game);
    } else {
      launch(game);
    }
  }, [beingLaunched, launch, forceClose, game]);

  return (
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
  );
};

export const LaunchButton = (props: HighLevelProps) => {
  const { game } = props;

  const socket = useSocket();
  const launches = useLaunches(l => l.gameId === game.id);
  const currentLaunchId = _.first(_.keys(launches));

  const [launch] = useAsyncCb(
    async (game: Game) => {
      await socket.query(queries.launchGame, { gameId: game.id });
    },
    [socket, game.id]
  );

  const [forceClose] = useAsyncCb(
    async (game: Game) => {
      if (!currentLaunchId) {
        return;
      }

      await socket.showModal(modals.forceClose, {
        game,
        launchId: currentLaunchId,
      });
    },
    [socket, game.id]
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
