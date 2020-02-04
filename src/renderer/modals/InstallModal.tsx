import { modalWidget } from "renderer/modals/ModalRouter";
import { modals } from "common/modals";
import { HardModal } from "renderer/modals/HardModal";
import React, { useState } from "react";
import { useAsync } from "renderer/use-async";
import { Game, Upload } from "common/butlerd/messages";
import { useSocket } from "renderer/contexts";
import { messages } from "common/butlerd";
import { Ellipsis } from "renderer/basics/Ellipsis";
import { gameCover } from "common/game-cover";
import { Button } from "renderer/basics/Button";
import styled from "styled-components";
import { fontSizes } from "renderer/theme";
import { useIntl, FormattedMessage } from "react-intl";
import { useAsyncCb } from "renderer/use-async-cb";
import _ from "lodash";
import { ErrorState } from "renderer/basics/ErrorState";

const GameBox = styled.div`
  width: 100%;
  padding: 4px;

  display: flex;
  flex-direction: row;
  align-items: center;
`;

const ErrorDiv = styled.div`
  font-size: ${fontSizes.large};
`;

const ErrorMessage = styled.div`
  font-size: ${fontSizes.large};
`;

let coverWidth = 290;
let coverHeight = 230;

let ratio = 0.4;

const Message = styled.div`
  padding: 15px 0;
  padding-bottom: 25px;
`;

const Cover = styled.img`
  width: ${coverWidth * ratio}px;
  height: ${coverHeight * ratio}px;

  margin-right: 10px;
`;

const Info = styled.div`
  display: flex;
  flex-direction: column;

  line-height: 1.6;
`;

const Title = styled.div`
  font-size: ${fontSizes.enormous};
  font-weight: 900;
`;

const ShortText = styled.div`
  font-size: ${fontSizes.normal};
  color: ${p => p.theme.colors.text2};
`;

interface Data {
  game: Game;
  upload?: Upload;
}

export const InstallModal = modalWidget(modals.install, props => {
  const socket = useSocket();
  const { gameId, buildId, uploadId } = props.params;

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
        convo => {
          convo.onNotification(messages.Log, params => {
            console.log(`${params.level} ${params.message}`);
          });
        }
      );
      window.close();
    } catch (e) {
      console.warn(e.stack);
      setInstallError(e);
    }
  }, [socket, data, gameId, buildId, uploadId]);

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
      upload: _.find(uploads, u => u.id === uploadId),
    };
    setData(data);
  }, [socket]);

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
            <GameBox>
              <Cover src={gameCover(data.game)} />
              <Info>
                <Title>{data.game.title}</Title>
                <ShortText>{data.game.shortText}</ShortText>
                <a href={data.game.url}>{data.game.url}</a>
              </Info>
            </GameBox>
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
