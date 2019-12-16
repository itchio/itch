import { messages } from "common/butlerd";
import { Game, Upload, FetchGameUploadsParams } from "common/butlerd/messages";
import { fileSize } from "common/format/filesize";
import React, { useEffect, useState } from "react";
import { useAsyncCallback, UseAsyncReturn } from "react-async-hook";
import { FormattedMessage } from "react-intl";
import { Button } from "renderer/basics/Button";
import { ErrorState } from "renderer/basics/ErrorState";
import { LoadingCircle } from "renderer/basics/LoadingCircle";
import { Buttons, Modal } from "renderer/basics/Modal";
import { UploadTitle } from "renderer/basics/upload";
import { useSocket } from "renderer/contexts";
import styled from "styled-components";

interface Props {
  game: Game;
  onClose: () => void;
}

const CaveItemList = styled.div`
  min-width: 600px;
  margin: 8px 0;
`;

const CaveItem = styled.div`
  margin: 12px 0;
  padding: 4px 0;
  border-radius: 2px;

  display: flex;
  flex-direction: row;
  align-items: center;
`;

const CaveDetails = styled.div`
  display: flex;
  flex-direction: column;
`;

const CaveDetailsRow = styled.div`
  padding: 6px 0;

  display: flex;
  flex-direction: row;
  align-items: center;

  .platform-icons {
    margin-left: 8px;
  }

  &.smaller {
    font-size: 90%;
  }
`;

const Spacer = styled.div`
  height: 1px;
  width: 8px;
`;

const Filler = styled.div`
  flex-grow: 1;
`;

const CaveItemActions = styled.div`
  display: flex;
  flex-direction: row;
  margin-right: 0;
`;

const Title = styled.div`
  margin-left: 8px;
  font-weight: bold;

  display: flex;
  flex-direction: row;
  align-items: center;
`;

const FileSize = styled.div`
  color: ${p => p.theme.colors.text2};
  margin-left: 8px;
`;

interface AvailableUploads {
  compatible: Upload[];
  others: Upload[];
}

export const InstallModal = (props: Props) => {
  return (
    <Modal title="Install some stuff?" onClose={props.onClose}>
      <InstallModalContents {...props} />
    </Modal>
  );
};

export const InstallModalContents = (props: Props) => {
  const socket = useSocket();
  const [uploadId, setUploadId] = useState<number | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [uploads, setUploads] = useState<AvailableUploads | null>(null);

  useEffect(() => {
    (async () => {
      const fguParams: FetchGameUploadsParams = {
        gameId: props.game.id,
        compatible: false,
      };

      try {
        const resAll = await socket.call(messages.FetchGameUploads, {
          ...fguParams,
          fresh: true,
        });

        const resCompat = await socket.call(messages.FetchGameUploads, {
          ...fguParams,
          compatible: true,
        });

        const compatMap: Record<number, boolean> = {};
        for (const u of resCompat.uploads) {
          compatMap[u.id] = true;
        }
        setUploads({
          compatible: resCompat.uploads,
          others: resAll.uploads.filter(u => !compatMap[u.id]),
        });

        setLoading(false);
      } catch (e) {
        alert(e.stack);
      }
    })();
  }, [uploadId]);

  const queueInstall = useAsyncCallback(async (upload: Upload) => {
    const locsRes = await socket.call(messages.InstallLocationsList, {});

    await socket.call(messages.InstallQueue, {
      game: props.game,
      upload: upload,
      build: upload.build,
      queueDownload: true,
      installLocationId: locsRes.installLocations[0].id,
    });
    props.onClose();
  });

  return (
    <Modal title="Install some stuff?" onClose={props.onClose}>
      <>
        {loading ? <LoadingCircle progress={0.3} wide /> : undefined}
        <CaveItemList>
          {uploads && (
            <>
              <UploadGroup
                items={uploads.compatible}
                queueInstall={queueInstall}
              />
              {uploads.others.length > 0 && (
                <>
                  <hr />
                  <UploadGroup
                    items={uploads.others}
                    queueInstall={queueInstall}
                  />
                </>
              )}
            </>
          )}
          <ErrorState error={queueInstall.error} />
        </CaveItemList>
      </>
      <Buttons>
        <Filler />
        <Button
          secondary
          label={<FormattedMessage id="prompt.action.cancel" />}
          onClick={props.onClose}
        />
      </Buttons>
    </Modal>
  );
};

const UploadGroup = (props: {
  items: Upload[];
  queueInstall: UseAsyncReturn<void, [Upload]>;
}) => {
  const { items, queueInstall } = props;
  return (
    <>
      {items.map(u => (
        <CaveItem key={u.id}>
          <CaveDetails>
            <CaveDetailsRow>
              <Title>
                <UploadTitle upload={u} />
              </Title>
            </CaveDetailsRow>
            <CaveDetailsRow className="smaller">
              {u.size > 0 ? <FileSize>{fileSize(u.size)}</FileSize> : null}
            </CaveDetailsRow>
          </CaveDetails>
          <Filler />
          <CaveItemActions>
            <Button
              icon="install"
              onClick={() => queueInstall.execute(u)}
              label={<FormattedMessage id="grid.item.install" />}
            />
          </CaveItemActions>
        </CaveItem>
      ))}
    </>
  );
};
