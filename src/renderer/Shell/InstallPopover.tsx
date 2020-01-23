import { messages } from "common/butlerd";
import {
  Cave,
  FetchGameUploadsParams,
  Game,
  Upload,
  UploadType,
} from "common/butlerd/messages";
import { formatDurationAsMessage } from "common/format/datetime";
import { fileSize } from "common/format/filesize";
import { packets } from "common/packets";
import { queries } from "common/queries";
import _ from "lodash";
import React, { useEffect, useRef, useState } from "react";
import { FormattedMessage } from "react-intl";
import { Button } from "renderer/basics/Button";
import { Icon } from "renderer/basics/Icon";
import { IconButton } from "renderer/basics/IconButton";
import { LoadingCircle, Spinner } from "renderer/basics/LoadingCircle";
import { MenuContents, MenuTippy } from "renderer/basics/Menu";
import { TimeAgo } from "renderer/basics/TimeAgo";
import { uploadIcons, UploadTitle } from "renderer/basics/upload";
import { ClickOutsideRefer } from "renderer/basics/useClickOutside";
import { useSocket } from "renderer/contexts";
import { pokeTippy } from "renderer/poke-tippy";
import { useListen } from "renderer/Socket";
import { fontSizes } from "renderer/theme";
import { useAsyncCb } from "renderer/use-async-cb";
import styled from "styled-components";
import { DownloadWithProgress } from "common/downloads";

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

    background: ${p => p.theme.colors.popoverHeaderBg};
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
      color: ${p => p.theme.colors.errorBg};
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
    const [fetchNumber, setFetchNumber] = useState(0);
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
    }, [fetchNumber]);

    useListen(
      socket,
      packets.downloadStarted,
      ({ download }) => {
        mergeDownloads({ [download.upload.id]: download });
        setQueued(_.omit(queued, download.upload.id));
      },
      []
    );
    useListen(
      socket,
      packets.downloadChanged,
      ({ download }) => {
        mergeDownloads({ [download.upload.id]: download });
      },
      []
    );
    useListen(
      socket,
      packets.downloadCleared,
      ({ download }) => {
        setDownloads(_.omit(downloads, download.upload.id));
      },
      []
    );
    useListen(
      socket,
      packets.gameInstalled,
      ({ cave }) => {
        mergeCaves({ [cave.upload.id]: cave });
      },
      []
    );
    useListen(
      socket,
      packets.gameUninstalled,
      () => {
        setFetchNumber(n => n + 1);
      },
      []
    );

    const divRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
      pokeTippy(divRef);
    });

    const [install] = useAsyncCb(
      async (upload: Upload) => {
        try {
          setQueued({ ...queued, [upload.id]: true });
          const locsRes = await socket.call(messages.InstallLocationsList, {});

          await socket.call(messages.InstallQueue, {
            game: props.game,
            upload: upload,
            queueDownload: true,
            installLocationId: locsRes.installLocations[0].id,
          });
          props.onClose();
        } catch (e) {
          setQueued(_.omit(queued, upload.id));
        }
      },
      [socket]
    );

    const [uninstall] = useAsyncCb(
      async (upload: Upload) => {
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
            await socket.query(queries.uninstallGame, { cave: existingCave });
            props.onClose();
          }
        } catch (e) {
          setQueued(_.omit(queued, upload.id));
        }
      },
      [socket]
    );

    const [launch] = useAsyncCb(
      async (caveId: string) => {
        props.onClose();

        await socket.query(queries.launchGame, {
          gameId: props.game.id,
          caveId,
        });
      },
      [socket, props.game.id]
    );

    const [explore] = useAsyncCb(
      async (caveId: string) => {
        props.onClose();
        await socket.query(queries.exploreCave, { caveId });
      },
      [socket]
    );

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
                  launch={launch}
                  explore={explore}
                  install={install}
                  uninstall={uninstall}
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
                      explore={explore}
                      launch={launch}
                      install={install}
                      uninstall={uninstall}
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
                        label={
                          <FormattedMessage id="install_modal.hide_other_downloads" />
                        }
                      />
                      <UploadGroup
                        queued={queued}
                        cavesByUpload={caves}
                        downloadsByUpload={downloads}
                        isOther
                        items={uploads.others}
                        install={install}
                        uninstall={uninstall}
                        launch={launch}
                      />
                    </>
                  ) : (
                    <Button
                      className="category"
                      onClick={ev => {
                        setShowOthers(true);
                      }}
                      icon="plus"
                      label={
                        <FormattedMessage id="install_modal.show_other_downloads" />
                      }
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
  launch: (caveId: string) => Promise<void>;
  explore: (caveId: string) => Promise<void>;
  install: (upload: Upload) => Promise<void>;
  uninstall: (upload: Upload) => Promise<void>;
  downloadsByUpload: DownloadsByUpload;
  cavesByUpload: CavesByUpload;
}) => {
  const { items, install, uninstall, launch, explore, isOther } = props;

  return (
    <>
      {items.map(u => {
        let dl: DownloadWithProgress | undefined =
          props.downloadsByUpload[u.id];
        const isQueued = props.queued[u.id];
        if (dl && dl.finishedAt) {
          dl = undefined;
        }
        const cave = props.cavesByUpload[u.id];
        const showDownload = !cave;

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
                {showDownload ? <DownloadInfo upload={u} /> : null}
                {cave ? (
                  <>
                    <p>
                      <FormattedMessage id="grid.filters.options.installed" />{" "}
                      <TimeAgo date={cave.stats.installedAt} /> &mdash;{" "}
                      {fileSize(cave.installInfo.installedSize)} on disk
                    </p>
                    {cave.stats.lastTouchedAt ? (
                      <p>
                        <FormattedMessage
                          id="usage_stats.last_played_time_ago"
                          values={{
                            time_ago: (
                              <TimeAgo date={cave.stats.lastTouchedAt} />
                            ),
                          }}
                        />
                      </p>
                    ) : (
                      <p>
                        <FormattedMessage id="usage_stats.never_played" />
                      </p>
                    )}
                    {cave.stats.secondsRun ? (
                      <p>
                        <FormattedMessage id="usage_stats.has_played_for_duration" />{" "}
                        <FormattedMessage
                          {...formatDurationAsMessage(cave.stats.secondsRun)}
                        />
                      </p>
                    ) : null}
                  </>
                ) : null}
                {isOther && !cave && !dl ? (
                  <p className="warning">
                    <FormattedMessage id="install_modal.incompatible_warning" />
                  </p>
                ) : null}
                <div className="button-group">
                  {cave ? (
                    <>
                      <IconButton
                        icon="play2"
                        onClick={() => {
                          if (cave) {
                            launch(cave.id);
                          }
                        }}
                      />
                      <IconButton
                        icon="folder-open"
                        onClick={() => explore(cave.id)}
                      />
                      <IconButton
                        icon="uninstall"
                        onClick={() => uninstall(u)}
                        disabled={isQueued}
                      />
                    </>
                  ) : (
                    <>
                      {dl ? null : (
                        <Button
                          className="real-button"
                          icon="install"
                          label={<FormattedMessage id="grid.item.install" />}
                          onClick={() => install(u)}
                          disabled={isQueued}
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

const DownloadInfo = (props: { upload: Upload }) => {
  const u = props.upload;
  const showPlatforms = u.size || hasPlatforms(u);

  return (
    <>
      {showPlatforms ? (
        <p>
          <Icon icon="download" /> {fileSize ? fileSize(u.size) : ""}{" "}
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
          <FormattedMessage id="upload_stats.last_update" />{" "}
          <TimeAgo date={u.updatedAt} />
        </p>
      )}
    </>
  );
};
