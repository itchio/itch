import { messages } from "common/butlerd";
import { Upload } from "@itchio/valet";
import { modals } from "common/modals";
import _ from "lodash";
import React, { useEffect, useRef, useState } from "react";
import { FormattedMessage } from "react-intl";
import { Button } from "renderer/basics/Button";
import { Ellipsis } from "renderer/basics/Ellipsis";
import { MenuContents } from "renderer/basics/Menu";
import { UploadTitle } from "renderer/basics/upload";
import { useSocket } from "renderer/contexts";
import { pokeTippy } from "renderer/poke-tippy";
import { useAsync } from "renderer/use-async";
import { useAsyncCb } from "renderer/use-async-cb";
import styled from "styled-components";

interface Props {
  gameId: number;
  onClose: () => void;
}

const MainUpload = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
`;

const InstallMenuContents = styled(MenuContents)`
  min-width: 300px;
  max-height: 320px;
  min-height: 3em;
`;

const EllipsisContainer = styled.div`
  justify-self: stretch;
  align-self: stretch;
  flex-grow: 1;

  display: flex;
  justify-content: center;
  align-items: center;
`;

export const InstallMenu = React.forwardRef((props: Props, ref: any) => {
  const { gameId, onClose } = props;
  const socket = useSocket();
  const [uploads, setUploads] = useState<Upload[] | undefined>();

  useAsync(async () => {
    try {
      const { uploads } = await socket.call(messages.FetchGameUploads, {
        gameId,
        compatible: true,
        fresh: true,
      });
      setUploads(uploads);
    } catch (e) {
      console.warn(e.stack);
      setUploads([]);
    }
  }, [gameId, socket]);

  const upload = _.first(uploads);

  const [quickInstall] = useAsyncCb(async () => {
    onClose();

    const { game } = await socket.call(messages.FetchGame, {
      gameId,
    });

    await socket.call(messages.InstallQueue, {
      game,
      upload,
      fastQueue: true,
      queueDownload: true,
    });
  }, [socket, gameId, upload, onClose]);

  const uploadId = upload?.id;

  const [showInstallDialog] = useAsyncCb(async () => {
    onClose();

    await socket.showModal(modals.installQueue, {
      gameId,
      uploadId,
    });
  }, [socket, gameId, uploadId, onClose]);

  const pokeRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    pokeTippy(pokeRef);
  });

  if (!uploads) {
    return (
      <InstallMenuContents ref={ref}>
        <EllipsisContainer>
          <Ellipsis />
        </EllipsisContainer>
      </InstallMenuContents>
    );
  }

  return (
    <InstallMenuContents ref={ref}>
      <div ref={pokeRef}></div>
      {upload ? (
        <Button
          onClick={quickInstall}
          label={
            <MainUpload>
              <UploadTitle upload={upload} showSize />
            </MainUpload>
          }
        />
      ) : null}
      <Button
        label={
          <>
            <FormattedMessage id="install_modal.show_other_downloads" />
            ...
          </>
        }
        onClick={showInstallDialog}
      />
    </InstallMenuContents>
  );
});
