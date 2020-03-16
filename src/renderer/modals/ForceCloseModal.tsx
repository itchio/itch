import { modalWidget } from "renderer/modals/ModalRouter";
import { modals } from "common/modals";
import { HardModal } from "renderer/modals/HardModal";
import { FormattedMessage } from "react-intl";
import React from "react";
import { Button } from "renderer/basics/Button";
import { SimpleGameRow } from "renderer/basics/SimpleGameRow";
import { useAsyncCb } from "renderer/use-async-cb";
import { useSocket } from "renderer/contexts";
import { queries } from "common/queries";

export const ForceCloseModal = modalWidget(modals.forceClose, props => {
  const { game, launchId } = props.params;

  const socket = useSocket();
  const [forceClose] = useAsyncCb(async () => {
    window.close();
    await socket.query(queries.cancelLaunch, {
      launchId,
      reason: "User clicked force close button in modal",
    });
  }, [launchId, socket]);

  return (
    <HardModal
      title={<FormattedMessage id="prompt.force_close_game.title" />}
      content={
        <>
          <p>
            <FormattedMessage
              id="prompt.force_close_game.message"
              values={{ title: game.title }}
            />
          </p>
          <SimpleGameRow game={game} />
        </>
      }
      buttons={
        <>
          <Button
            secondary
            label={<FormattedMessage id="prompt.action.cancel" />}
            onClick={() => window.close()}
          />
          <Button
            icon="stop"
            className="force-close-confirm"
            label={<FormattedMessage id="prompt.action.force_close" />}
            onClick={forceClose}
          />
        </>
      }
    />
  );
});
