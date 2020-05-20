import { messages } from "common/butlerd";
import { Game, Upload } from "@itchio/valet";
import { modals } from "common/modals";
import _ from "lodash";
import React, { useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { Button } from "renderer/basics/Button";
import { Ellipsis } from "renderer/basics/Ellipsis";
import { ErrorState } from "renderer/basics/ErrorState";
import { useSocket } from "renderer/contexts";
import { HardModal } from "renderer/modals/HardModal";
import { modalWidget } from "renderer/modals/ModalRouter";
import { fontSizes } from "renderer/theme";
import { useAsync } from "renderer/use-async";
import { useAsyncCb } from "renderer/use-async-cb";
import styled from "styled-components";
import { SimpleGameRow } from "renderer/basics/SimpleGameRow";

const ErrorDiv = styled.div`
  font-size: ${fontSizes.large};
`;

const ErrorMessage = styled.div`
  font-size: ${fontSizes.large};
`;

const Message = styled.div`
  padding: 15px 0;
  padding-bottom: 25px;
`;

interface Data {
  game: Game;
  upload?: Upload;
}

export const InstallModal = modalWidget(modals.install, (props) => {
  const socket = useSocket();
  const { gameId, uploadId } = props.params;

  const [data, setData] = useState<Data | undefined>();

  const [installError, setInstallError] = useState<any | undefined>();
  const [install, installLoading] = useAsyncCb(async () => {
    try {
      const locsRes = await socket.call(messages.InstallLocationsList, {});

      if (!data) {
        console.warn("Lacking data");
        return;
      }

      console.log(`About to queue...`);
      await socket.call(
        messages.InstallQueue,
        {
          game: data.game,
          upload: data.upload,
          queueDownload: true,
          fastQueue: true,
          installLocationId: locsRes.installLocations[0].id,
        },
        (convo) => {
          convo.onNotification(messages.Log, (params) => {
            console.log(`${params.level} ${params.message}`);
          });
        }
      );
      window.close();
    } catch (e) {
      console.warn(e.stack);
      setInstallError(e);
    }
  }, [socket, data]);

  useAsync(async () => {
    const { game } = await socket.call(messages.FetchGame, {
      gameId,
    });

    const { uploads } = await socket.call(messages.FetchGameUploads, {
      compatible: false,
      gameId,
    });
    const data: Data = {
      game,
      upload: _.find(uploads, (u) => u.id === uploadId),
    };
    setData(data);
  }, [gameId, socket, uploadId]);

  const intl = useIntl();

  return (
    <HardModal
      title={intl.formatMessage({
        id: "prompt.url_install.title",
      })}
      content={
        installError ? (
          <ErrorDiv>
            <ErrorMessage>
              <ErrorState error={installError} />
            </ErrorMessage>
          </ErrorDiv>
        ) : data ? (
          <>
            <Message>
              <FormattedMessage
                id="prompt.url_install.message"
                values={{ title: data.game.title }}
              />
            </Message>
            <SimpleGameRow game={data.game} upload={data.upload} />
          </>
        ) : (
          <Ellipsis />
        )
      }
      buttons={
        <>
          <Button
            secondary
            onClick={() => window.close()}
            label={
              <FormattedMessage
                id={
                  installError ? "prompt.action.close" : "prompt.action.cancel"
                }
              />
            }
          />
          {installError ? null : (
            <Button
              loading={installLoading}
              onClick={install}
              icon="install"
              label={<FormattedMessage id="prompt.action.install" />}
            />
          )}
        </>
      }
    />
  );
});
