import React, { useState } from "react";
import { modals } from "common/modals";
import { useSocket } from "renderer/contexts";
import { FormattedMessage } from "react-intl";
import { HardModal } from "renderer/modals/HardModal";
import { modalWidget } from "renderer/modals/ModalRouter";
import { Button } from "renderer/basics/Button";
import { useAsync } from "renderer/use-async";
import { messages } from "common/butlerd";
import { Game, Cave } from "common/butlerd/messages";
import { useAsyncCb } from "renderer/use-async-cb";
import { queries } from "common/queries";

interface Data {
  game: Game;
  caves: Cave[];
}

export const ConfirmUninstallModal = modalWidget(
  modals.confirmUninstall,
  props => {
    const { onResult } = props;
    const { gameId } = props.params;

    const socket = useSocket();
    const [data, setData] = useState<Data | undefined>();
    useAsync(async () => {
      try {
        const { game } = await socket.call(messages.FetchGame, {
          gameId,
        });
        if (!game) {
          throw new Error(`game ${gameId} not found`);
        }

        const { items } = await socket.call(messages.FetchCaves, {
          filters: {
            gameId,
          },
        });
        setData({ game, caves: items });
      } catch (e) {
        console.warn(`Could not fetch game or caves: `, e.stack);
        onResult({});
      }
    }, [gameId, onResult, socket]);

    // TODO: use isExecuting/error/success instead
    const [uninstall] = useAsyncCb(async () => {
      if (!data) {
        return;
      }

      onResult({});
      try {
        for (const cave of data.caves) {
          await socket.query(queries.uninstallGame, {
            cave,
          });
        }
      } catch (e) {
        console.warn(`Could not queue uninstalls: `, e.stack);
      }
    }, [data, onResult, socket]);

    if (!data) {
      return <></>;
    }

    return (
      <HardModal
        title={data.game.title}
        content={
          <FormattedMessage
            id="prompt.uninstall.message"
            values={{ title: data.game.title }}
          />
        }
        buttons={
          <>
            <Button
              label={<FormattedMessage id="prompt.action.cancel" />}
              onClick={() => props.onResult({})}
              secondary
            />
            <Button
              label={<FormattedMessage id="prompt.uninstall.uninstall" />}
              onClick={uninstall}
              icon="install"
            />
          </>
        }
      />
    );
  }
);
