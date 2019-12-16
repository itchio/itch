import classNames from "classnames";
import { messages } from "common/butlerd";
import {
  FetchGameUploadsParams,
  Game,
  Upload,
  UploadType,
} from "common/butlerd/messages";
import { fileSize } from "common/format/filesize";
import React, { useEffect, useRef, useState } from "react";
import { useAsyncCallback, UseAsyncReturn } from "react-async-hook";
import { FormattedMessage } from "react-intl";
import { Button } from "renderer/basics/Button";
import { ErrorState } from "renderer/basics/ErrorState";
import { Icon } from "renderer/basics/Icon";
import { Spinner } from "renderer/basics/LoadingCircle";
import { MenuContents, MenuTippy } from "renderer/basics/Menu";
import { Modal } from "renderer/basics/Modal";
import { TimeAgo } from "renderer/basics/TimeAgo";
import { uploadIcons, UploadTitle } from "renderer/basics/upload";
import { useSocket } from "renderer/contexts";
import { pokeTippy } from "renderer/poke-tippy";
import { fontSizes } from "renderer/theme";
import styled from "styled-components";

const InstallMenuContents = styled(MenuContents)`
  overflow: hidden;
  border-radius: 4px;

  .header {
    box-shadow: 0 0 40px ${p => p.theme.colors.shellBg};

    background: #d8d8d8;
    color: black;

    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: center;

    font-size: ${fontSizes.normal};
    font-weight: bold;

    padding: 0.6em 1.2em;
  }

  .spinner {
    margin: 10px auto;
  }

  .isOther {
    color: ${p => p.theme.colors.text2};
  }

  width: 350px;
  max-height: 250px;
  min-height: 3em;

  .list {
    overflow-y: auto;

    display: flex;
    flex-direction: column;
    align-items: stretch;
  }

  .filler {
    flex-grow: 1;
  }
`;

const UploadInfo = styled.div`
  font-size: ${fontSizes.normal};

  .icon {
    padding: 0.4em;
  }

  padding: 0.2em 0;
  min-width: 200px;

  p {
    line-height: 1.6;
    padding: 0.4em 0.8em;

    &.warning {
      background: ${p => p.theme.colors.errorBg};
      color: ${p => p.theme.colors.errorText};
      border-radius: 0 0 4px 4px;
    }
  }
`;

interface Props {
  game: Game;
  onClose: () => void;
}

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

  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    pokeTippy(ref);
  });

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

  const hasUploads =
    uploads && (uploads.compatible.length > 0 || uploads.others.length > 0);

  return (
    <>
      <InstallMenuContents ref={ref}>
        {loading ? (
          <Spinner />
        ) : uploads && hasUploads ? (
          <>
            <div className="header">
              <Icon icon="download" />
              <span className="title">{props.game.title}</span>
            </div>
            <div className="list">
              <UploadGroup
                items={uploads.compatible}
                queueInstall={queueInstall}
              />
              {uploads.others.length > 0 && (
                <>
                  <UploadGroup
                    isOther
                    items={uploads.others}
                    queueInstall={queueInstall}
                  />
                </>
              )}
            </div>
          </>
        ) : (
          <>
            <p>
              <FormattedMessage id="butlerd.codes.2001" />
            </p>
            <Button
              icon="earth"
              label={<FormattedMessage id="grid.item.open_page" />}
              onClick={() => (location.href = props.game.url)}
            />
          </>
        )}

        <ErrorState error={queueInstall.error} />
      </InstallMenuContents>
    </>
  );
};

function hasPlatforms(u: Upload): boolean {
  return (
    !!u.platforms.linux ||
    !!u.platforms.windows ||
    !!u.platforms.osx ||
    u.type === UploadType.HTML
  );
}

const UploadGroup = (props: {
  isOther?: boolean;
  items: Upload[];
  queueInstall: UseAsyncReturn<void, [Upload]>;
}) => {
  const { items, queueInstall, isOther } = props;
  return (
    <>
      {items.map(u => (
        <>
          <MenuTippy
            placement="right-start"
            interactive
            content={
              <UploadInfo>
                {u.size || hasPlatforms(u) ? (
                  <p>
                    <Icon icon="download" /> {fileSize(u.size)} download{" "}
                    {u.platforms.linux && <Icon icon="tux" />}
                    {u.platforms.windows && <Icon icon="windows8" />}
                    {u.platforms.osx && <Icon icon="apple" />}
                    {u.type === UploadType.HTML && <Icon icon="html5" />}
                  </p>
                ) : null}
                {u.type !== "default" && u.type !== "other" && (
                  <p>
                    <Icon icon={uploadIcons[u.type]} />{" "}
                    <FormattedMessage id={`upload_type.${u.type}`} />
                  </p>
                )}
                {u.demo && <p>Demo</p>}
                {u.build ? (
                  <>
                    <p>
                      Version {u.build.userVersion || u.build.version} &mdash;{" "}
                      <TimeAgo date={u.build.createdAt} />
                    </p>
                  </>
                ) : (
                  <p>
                    Updated <TimeAgo date={u.updatedAt} />
                  </p>
                )}
                {isOther ? (
                  <p className="warning">This upload may be incompatible.</p>
                ) : null}
              </UploadInfo>
            }
            boundary="viewport"
          >
            <Button
              className={classNames({ isOther })}
              key={u.id}
              onClick={() => queueInstall.execute(u)}
              label={
                <UploadTitle
                  showIcon={false}
                  upload={u}
                  after={
                    isOther ? (
                      <>
                        <div className="filler" />
                        <Icon icon="unchecked" />
                      </>
                    ) : (
                      <>
                        <div className="filler" />
                        <Icon icon="checked" />
                      </>
                    )
                  }
                />
              }
            />
          </MenuTippy>
        </>
      ))}
    </>
  );
};
