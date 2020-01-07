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
import { useListen } from "renderer/Socket";
import { packets } from "common/packets";
import { formatDurationAsMessage } from "common/format/datetime";
import { IconButton } from "renderer/basics/IconButton";
import { useSingleton } from "@tippy.js/react";

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

    background: #404040; /* TODO: theme */
    color: ${p => p.theme.colors.text2};

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

    .category {
      font-size: ${fontSizes.small};
      font-weight: bold;
      color: ${p => p.theme.colors.text2};

      padding: 0.4em;
      padding-left: 0.8em;
    }
  }

  .filler {
    flex-grow: 1;
  }
`;

const UploadInfoDiv = styled.div`
  font-size: ${fontSizes.normal};

  padding: 0.2em 0;
  width: 350px;

  p {
    line-height: 1.6;
    padding: 0.4em 0.8em;

    & > .icon {
      padding: 0.4em;
    }

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
  onClose: () => void;
}

interface AvailableUploads {
  compatible: Upload[];
  local: Upload[];
  others: Upload[];
}

interface DownloadsByUpload {
  [uploadId: number]: DownloadWithProgress | undefined;
}

interface CavesByUpload {
  [uploadId: number]: Cave | undefined;
}

interface Queued {
  [uploadId: number]: boolean;
}

export const InstallModalContents = React.forwardRef(
  (props: Props, ref: any) => {
    const socket = useSocket();
    const [uninstalling, setUninstalling] = useState<Cave | null>(null);
    const [loading, setLoading] = useState(true);
    const [queued, setQueued] = useState<Queued>({});

    const [downloads, setDownloads] = useState<DownloadsByUpload>({});
    const mergeDownloads = (fresh: DownloadsByUpload) => {
      setDownloads({ ...downloads, ...fresh });
    };
    const [caves, setCaves] = useState<CavesByUpload>({});
    const mergeCaves = (fresh: CavesByUpload) => {
      setCaves({ ...caves, ...fresh });
    };
    const [uploads, setUploads] = useState<AvailableUploads | null>(null);

    useEffect(() => {
      (async () => {
        const { downloads } = await socket.query(queries.getDownloadsForGame, {
          gameId: props.game.id,
        });
        setDownloads(_.keyBy(downloads, x => x.upload.id));

        const { items } = await socket.call(messages.FetchCaves, {
          filters: {
            gameId: props.game.id,
          },
        });
        setCaves(_.keyBy(items, x => x.upload.id));

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

          const caves = (
            await socket.call(messages.FetchCaves, {
              filters: {
                gameId: props.game.id,
              },
            })
          ).items;

          const compatible = resCompat.uploads;

          const compatMap = _.keyBy(compatible, u => u.id);
          const others = _.filter(resAll.uploads, u => !compatMap[u.id]);

          const allMap = _.keyBy(resAll.uploads, u => u.id);
          const local = _.filter(
            _.map(caves, c => c.upload),
            u => !allMap[u.id]
          );

          setUploads({
            compatible,
            local,
            others,
          });

          setLoading(false);
        } catch (e) {
          alert(e.stack);
        }
      })();
    }, []);

    useListen(socket, packets.downloadStarted, ({ download }) => {
      mergeDownloads({ [download.upload.id]: download });
      setQueued(_.omit(queued, download.upload.id));
    });
    useListen(socket, packets.downloadChanged, ({ download }) => {
      mergeDownloads({ [download.upload.id]: download });
    });
    useListen(socket, packets.downloadCleared, ({ download }) => {
      setDownloads(_.omit(downloads, download.upload.id));
    });
    useListen(socket, packets.gameInstalled, ({ cave }) => {
      mergeCaves({ [cave.upload.id]: cave });
    });
    useListen(socket, packets.gameUninstalled, ({ uploadId }) => {
      setCaves(_.omit(caves, uploadId));
    });

    const divRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
      pokeTippy(divRef);
    });

    const toggleInstalled = useAsyncCallback(async (upload: Upload) => {
      try {
        setQueued({ ...queued, [upload.id]: true });

        const { items } = await socket.call(messages.FetchCaves, {
          filters: {
            gameId: props.game.id,
          },
        });
        const existingCave = _.find<Cave>(
          items,
          x => x.upload.id === upload.id
        );
        if (existingCave) {
          setQueued(_.omit(queued, upload.id));

          // in this case, uninstall, but confirm first
          setUninstalling(existingCave);
          return;
        }

        props.onClose();
        const locsRes = await socket.call(messages.InstallLocationsList, {});

        await socket.call(messages.InstallQueue, {
          game: props.game,
          upload: upload,
          queueDownload: true,
          installLocationId: locsRes.installLocations[0].id,
        });
      } catch (e) {
        setQueued(_.omit(queued, upload.id));
      }
    });

    const launch = useAsyncCallback(async (caveId: string) => {
      props.onClose();

      await socket.query(queries.launchGame, {
        gameId: props.game.id,
        caveId,
      });
    });

    const uninstall = useAsyncCallback(async (cave: Cave) => {
      setUninstalling(null);
      props.onClose();
      setDownloads(_.omit(downloads, cave.upload.id));
      await socket.query(queries.uninstallGame, { cave });
    });

    const [showOthers, setShowOthers] = useState(false);

    const hasUploads =
      uploads &&
      !(
        _.isEmpty(uploads.compatible) &&
        _.isEmpty(uploads.local) &&
        _.isEmpty(uploads.others)
      );

    return (
      <>
        {uninstalling ? (
          <Modal ref={props.coref("uninstall-modal")}>
            <p>
              <FormattedMessage
                id="prompt.uninstall.message"
                values={{ title: props.game.title }}
              />
            </p>
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
                  queued={queued}
                  cavesByUpload={caves}
                  downloadsByUpload={downloads}
                  items={uploads.compatible}
                  toggleInstalled={toggleInstalled}
                  launch={launch}
                />
                {!_.isEmpty(uploads.local) && (
                  <>
                    <Button
                      className="category"
                      icon="folder-open"
                      label="Local downloads"
                    />
                    <UploadGroup
                      queued={queued}
                      cavesByUpload={caves}
                      downloadsByUpload={downloads}
                      items={uploads.local}
                      toggleInstalled={toggleInstalled}
                    />
                  </>
                )}
                {!_.isEmpty(uploads.others) &&
                  (showOthers ? (
                    <>
                      <Button
                        className="category"
                        onClick={ev => {
                          setShowOthers(false);
                        }}
                        icon="minus"
                        label="Hide other downloads"
                      />
                      <UploadGroup
                        queued={queued}
                        cavesByUpload={caves}
                        downloadsByUpload={downloads}
                        isOther
                        items={uploads.others}
                        toggleInstalled={toggleInstalled}
                      />
                    </>
                  ) : (
                    <Button
                      className="category"
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
  queued: Queued;
  toggleInstalled: UseAsyncReturn<void, [Upload]>;
  launch: UseAsyncReturn<void, [string]>;
  downloadsByUpload: DownloadsByUpload;
  cavesByUpload: CavesByUpload;
}) => {
  const { items, toggleInstalled, launch, isOther } = props;

  return (
    <>
      {items.map(u => {
        let dl: DownloadWithProgress | undefined =
          props.downloadsByUpload[u.id];
        const isQueued = props.queued[u.id];
        if (dl && dl.finishedAt) {
          dl = undefined;
        }
        let cave = props.cavesByUpload[u.id];

        return (
          <MenuTippy
            key={u.id}
            placement="right-start"
            interactive
            trigger="click"
            content={
              <UploadInfoDiv>
                {dl && dl.progress ? (
                  <p>
                    {(dl.progress.progress * 100).toFixed()}% &mdash;{" "}
                    {fileSize(dl.progress.bps)} / s &mdash;{" "}
                    <FormattedMessage
                      {...formatDurationAsMessage(dl.progress.eta)}
                    />
                  </p>
                ) : null}
                {u.size || hasPlatforms(u) ? (
                  <p>
                    <Icon icon="download" /> {fileSize ? fileSize(u.size) : ""}{" "}
                    download {u.platforms.linux && <Icon icon="tux" />}
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
                {cave ? (
                  <>
                    <p>
                      Installed <TimeAgo date={cave.stats.installedAt} />{" "}
                      &mdash; {fileSize(cave.installInfo.installedSize)} on disk
                    </p>
                    <p>
                      Last played <TimeAgo date={cave.stats.lastTouchedAt} />{" "}
                      &mdash; Total{" "}
                      <FormattedMessage
                        {...formatDurationAsMessage(cave.stats.secondsRun)}
                      />
                    </p>
                  </>
                ) : null}
                {isOther && !cave && !dl ? (
                  <p className="warning">This upload may be incompatible.</p>
                ) : null}
                <div className="button-group">
                  {cave ? (
                    <>
                      <IconButton
                        icon="play2"
                        onClick={() => {
                          if (cave) {
                            launch.execute(cave.id);
                          }
                        }}
                      />
                      <IconButton
                        icon="folder-open"
                        onClick={() => console.log("stub")}
                      />
                      <IconButton
                        icon="uninstall"
                        onClick={() => toggleInstalled.execute(u)}
                      />
                    </>
                  ) : (
                    <>
                      {dl ? null : (
                        <IconButton
                          icon="install"
                          onClick={() => toggleInstalled.execute(u)}
                        />
                      )}
                    </>
                  )}
                </div>
              </UploadInfoDiv>
            }
            boundary="viewport"
          >
            <Button
              // onClick={() => toggleInstalled.execute(u)}
              label={
                <UploadTitle
                  showIcon={false}
                  upload={u}
                  after={
                    <>
                      <div className="filler" />
                      {dl || isQueued ? (
                        <>
                          <LoadingCircle
                            progress={dl?.progress?.progress ?? 0}
                          />{" "}
                        </>
                      ) : (
                        <Icon icon={cave ? "checked" : "install"} />
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
