import { messages } from "common/butlerd";
import {
  FetchGameUploadsParams,
  Game,
  Upload,
  UploadType,
  Cave,
} from "common/butlerd/messages";
import { fileSize } from "common/format/filesize";
import React, { useEffect, useRef, useState } from "react";
import { useAsyncCallback, UseAsyncReturn } from "react-async-hook";
import { FormattedMessage } from "react-intl";
import { Button } from "renderer/basics/Button";
import { ErrorState } from "renderer/basics/ErrorState";
import { Icon } from "renderer/basics/Icon";
import { Spinner, LoadingCircle } from "renderer/basics/LoadingCircle";
import { MenuContents, MenuTippy } from "renderer/basics/Menu";
import { Modal, Buttons } from "renderer/basics/Modal";
import { TimeAgo } from "renderer/basics/TimeAgo";
import { uploadIcons, UploadTitle } from "renderer/basics/upload";
import { useSocket } from "renderer/contexts";
import { pokeTippy } from "renderer/poke-tippy";
import { fontSizes } from "renderer/theme";
import styled from "styled-components";
import { ClickOutsideRefer } from "renderer/basics/useClickOutside";
import { queries } from "common/queries";
import { DownloadWithProgress } from "main/drive-downloads";
import _ from "lodash";

const InstallMenuContents = styled(MenuContents)`
  overflow: hidden;
  border-radius: 4px;

  .no-uploads {
    font-size: ${fontSizes.normal};
    background: ${p => p.theme.colors.errorBg};
    color: ${p => p.theme.colors.errorText};

    padding: 1em;
  }

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

    & > .icon {
      margin-right: 0.5em;
    }
  }

  .spinner {
    margin: 10px auto;
  }

  width: 350px;
  max-height: 320px;
  min-height: 3em;

  .list {
    overflow-y: auto;

    display: flex;
    flex-direction: column;
    align-items: stretch;

    .heading {
      text-align: center;
    }

    .heading,
    .show-hidden {
      font-size: ${fontSizes.small};
      font-weight: bold;
      color: ${p => p.theme.colors.text2};

      padding: 0.5em;
    }
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
      font-size: ${fontSizes.small};
      background: ${p => p.theme.colors.errorBg};
      color: ${p => p.theme.colors.errorText};
      border-radius: 0 0 4px 4px;
    }
  }
`;

interface Props {
  game: Game;
  coref: ClickOutsideRefer;
}

interface ModalProps extends Props {
  onClose: () => void;
}

interface AvailableUploads {
  compatible: Upload[];
  others: Upload[];
}

interface DownloadsByUpload {
  [uploadId: number]: DownloadWithProgress | undefined;
}

interface CavesByUpload {
  [uploadId: number]: Cave | undefined;
}

export const InstallModalContents = React.forwardRef(
  (props: Props, ref: any) => {
    const socket = useSocket();
    const [uninstalling, setUninstalling] = useState<Cave | null>(null);
    const [loading, setLoading] = useState(true);
    const [downloadsByUpload, setDownloadsByUpload] = useState<
      DownloadsByUpload
    >({});
    const [cavesByUpload, setCavesByUpload] = useState<CavesByUpload>({});
    const [uploads, setUploads] = useState<AvailableUploads | null>(null);

    useEffect(() => {
      (async () => {
        const { downloads } = await socket.query(queries.getDownloadsForGame, {
          gameId: props.game.id,
        });
        setDownloadsByUpload(_.keyBy(downloads, x => x.upload.id));

        const { items } = await socket.call(messages.FetchCaves, {
          filters: {
            gameId: props.game.id,
          },
        });
        setCavesByUpload(_.keyBy(items, x => x.upload.id));

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
    }, []);

    const divRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
      pokeTippy(divRef);
    });

    const toggleInstalled = useAsyncCallback(async (upload: Upload) => {
      const { items } = await socket.call(messages.FetchCaves, {
        filters: {
          gameId: props.game.id,
        },
      });
      const existingCave = _.find<Cave>(items, x => x.upload.id === upload.id);
      if (existingCave) {
        // in this case, uninstall, but confirm first
        setUninstalling(existingCave);
      }

      const locsRes = await socket.call(messages.InstallLocationsList, {});

      await socket.call(messages.InstallQueue, {
        game: props.game,
        upload: upload,
        build: upload.build,
        queueDownload: true,
        installLocationId: locsRes.installLocations[0].id,
      });
    });

    const uninstall = useAsyncCallback(async (cave: Cave) => {
      setUninstalling(null);
      await socket.call(messages.UninstallPerform, { caveId: cave.id });
      setDownloadsByUpload(_.omit(downloadsByUpload, cave.upload.id));
    });

    const [showOthers, setShowOthers] = useState(false);

    const hasUploads =
      uploads && (uploads.compatible.length > 0 || uploads.others.length > 0);

    return (
      <>
        {uninstalling ? (
          <Modal
            ref={props.coref("uninstall-modal")}
            title="Uninstall item?"
            onClose={() => setUninstalling(null)}
          >
            <p>Are you sure you want to uninstalling this?</p>
            <Buttons>
              <Button
                secondary
                label="Cancel"
                onClick={() => setUninstalling(null)}
              />
              <Button
                autoFocus
                label="Uninstall"
                icon="uninstall"
                onClick={() => {
                  console.log("Uninstall clicked!");
                  uninstall.execute(uninstalling);
                }}
              ></Button>
            </Buttons>
          </Modal>
        ) : null}
        <InstallMenuContents ref={ref}>
          <div ref={divRef} />
          {loading ? (
            <Spinner />
          ) : uploads && hasUploads ? (
            <>
              <div className="header">
                <Icon icon="install" />
                <span className="title">{props.game.title}</span>
              </div>
              <div className="list">
                <UploadGroup
                  cavesByUpload={cavesByUpload}
                  downloadsByUpload={downloadsByUpload}
                  items={uploads.compatible}
                  toggleInstalled={toggleInstalled}
                />
                {uploads.others.length > 0 &&
                  (showOthers ? (
                    <>
                      <Button
                        className="show-hidden"
                        onClick={ev => {
                          setShowOthers(false);
                        }}
                        icon="minus"
                        label="Hide other downloads"
                      />
                      <UploadGroup
                        cavesByUpload={cavesByUpload}
                        downloadsByUpload={downloadsByUpload}
                        isOther
                        items={uploads.others}
                        toggleInstalled={toggleInstalled}
                      />
                    </>
                  ) : (
                    <Button
                      className="show-hidden"
                      onClick={ev => {
                        setShowOthers(true);
                      }}
                      icon="plus"
                      label="Show other downloads"
                    />
                  ))}
              </div>
            </>
          ) : (
            <>
              <p className="no-uploads">
                <FormattedMessage id="butlerd.codes.2001" />
              </p>
              <Button
                icon="earth"
                label={<FormattedMessage id="grid.item.open_page" />}
                onClick={() => (location.href = props.game.url)}
              />
            </>
          )}

          <ErrorState error={toggleInstalled.error} />
        </InstallMenuContents>
      </>
    );
  }
);

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
  toggleInstalled: UseAsyncReturn<void, [Upload]>;
  downloadsByUpload: DownloadsByUpload;
  cavesByUpload: CavesByUpload;
}) => {
  const { items, toggleInstalled, isOther } = props;
  return (
    <>
      {items.map(u => {
        let dl: DownloadWithProgress | undefined =
          props.downloadsByUpload[u.id];
        if (dl && dl.finishedAt) {
          dl = undefined;
        }

        return (
          <MenuTippy
            key={u.id}
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
              onClick={() => toggleInstalled.execute(u)}
              label={
                <UploadTitle
                  showIcon={false}
                  upload={u}
                  after={
                    <>
                      <div className="filler" />
                      {dl ? (
                        <>
                          <LoadingCircle
                            progress={dl.progress?.progress ?? 0}
                          />{" "}
                        </>
                      ) : (
                        <Icon
                          icon={
                            props.cavesByUpload[u.id] ? "checked" : "unchecked"
                          }
                        />
                      )}
                    </>
                  }
                />
              }
            />
          </MenuTippy>
        );
      })}
    </>
  );
};
