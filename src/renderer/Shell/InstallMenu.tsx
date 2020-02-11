import { messages } from "common/butlerd";
import { Upload } from "common/butlerd/messages";
import React, { useState } from "react";
import { Button } from "renderer/basics/Button";
import { Ellipsis } from "renderer/basics/Ellipsis";
import { MenuContents } from "renderer/basics/Menu";
import { useSocket } from "renderer/contexts";
import { useAsync } from "renderer/use-async";
import styled from "styled-components";
import _ from "lodash";
import { UploadTitle } from "renderer/basics/upload";
import { FormattedMessage } from "react-intl";
import { useAsyncCb } from "renderer/use-async-cb";
import { modals } from "common/modals";
import { fileSize } from "common/format/filesize";
import { fontSizes } from "renderer/theme";

interface Props {
  gameId: number;
}

const MainUpload = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
`;

const UploadSize = styled.div`
  margin-left: 1em;
  color: ${p => p.theme.colors.text2};

  font-size: ${fontSizes.small};
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
  const { gameId } = props;
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
  }, [gameId]);

  const upload = _.first(uploads);

  const [quickInstall] = useAsyncCb(async () => {
    const { game } = await socket.call(messages.FetchGame, {
      gameId,
    });

    await socket.call(messages.InstallQueue, {
      game,
      upload,
      fastQueue: true,
      queueDownload: true,
    });
  }, [socket, gameId, upload]);

  const [showInstallDialog] = useAsyncCb(async () => {
    await socket.showModal(modals.installQueue, {
      gameId,
      uploadId: upload?.id,
    });
  }, [socket, gameId]);

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
      {upload ? (
        <Button
          onClick={quickInstall}
          label={
            <MainUpload>
              <UploadTitle upload={upload} />
              {!!upload.size && (
                <UploadSize>{fileSize(upload.size)}</UploadSize>
              )}
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
