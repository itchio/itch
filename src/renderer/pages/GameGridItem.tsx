import classNames from "classnames";
import { Game, GameRecord } from "@itchio/valet/messages";
import { DownloadWithProgress } from "common/downloads";
import { formatDurationAsMessage } from "common/format/datetime";
import { fileSize } from "common/format/filesize";
import React, { useCallback } from "react";
import { FormattedMessage } from "react-intl";
import { Icon } from "renderer/basics/Icon";
import { IconButton } from "renderer/basics/IconButton";
import { LaunchButtonBase } from "renderer/basics/LaunchButton";
import { MenuTippy } from "renderer/basics/Menu";
import { ClickOutsideRefer } from "renderer/basics/use-click-outside";
import { ProgressBar } from "renderer/pages/ProgressBar";
import { InstallPopoverContents } from "renderer/Shell/InstallPopover";
import { Button } from "renderer/basics/Button";

interface Props {
  coref: ClickOutsideRefer;
  game: GameRecord;
  launch: (gameId: number) => Promise<void>;
  forceClose: (gameId: number) => Promise<void>;
  install: (gameId: number) => Promise<void>;
  purchase: (gameId: number) => Promise<void>;
  dl?: DownloadWithProgress;
  stopInstall: () => void;
  gameBeingInstalled?: Game;
  beingLaunched?: boolean;
}

export const GameGridItem = React.memo((props: Props) => {
  const {
    coref,
    game,
    dl,
    launch,
    forceClose,
    stopInstall,
    gameBeingInstalled,
    beingLaunched,
    install,
    purchase,
  } = props;

  const gameId = game.id;

  const onInstall = useCallback(() => {
    return install(gameId);
  }, [gameId, install]);

  const onPurchase = useCallback(() => {
    return purchase(gameId);
  }, [gameId, purchase]);

  let wrapInTippyIfNeeded = (content: JSX.Element): JSX.Element => {
    if (gameBeingInstalled) {
      return (
        <MenuTippy
          placement="left-end"
          appendTo={document.body}
          content={
            <InstallPopoverContents
              ref={coref("install-modal-contents")}
              coref={coref}
              game={gameBeingInstalled}
              onClose={stopInstall}
            />
          }
          interactive
          visible
        >
          {content}
        </MenuTippy>
      );
    }
    return content;
  };

  return (
    <div
      className={classNames("item", { installed: !!game.installedAt })}
      data-game-id={game.id}
    >
      <a href={`itch://games/${game.id}`}>
        <div className="cover-container">
          <DownloadOverlay dl={dl} />
          {game.cover ? (
            <img className="cover" src={game.cover} />
          ) : (
            <div className="cover missing" />
          )}
        </div>
      </a>
      <div className="title">{game.title}</div>
      <div className="buttons">
        <div className="filler" />
        {game.owned ? null : (
          <IconButton icon="heart-filled" onClick={onPurchase} />
        )}

        <InstallButton
          gameId={game.id}
          icon={!!game.installedAt}
          install={onInstall}
          wrapper={wrapInTippyIfNeeded}
        />
        {game.installedAt && (
          <LaunchButtonBase
            beingLaunched={beingLaunched}
            launch={launch}
            forceClose={forceClose}
            gameId={game.id}
          />
        )}
      </div>
    </div>
  );
});

const DownloadOverlay = (props: { dl?: DownloadWithProgress }) => {
  const { dl } = props;
  if (!dl || dl.finishedAt) {
    return null;
  }
  const { progress } = dl;

  return (
    <div className="download-overlay">
      {progress ? (
        <>
          <ProgressBar progress={progress.progress} />
          {progress.bps > 0 || progress.eta > 0 ? (
            <div>
              {fileSize(progress.bps)} / s &mdash;{" "}
              <FormattedMessage {...formatDurationAsMessage(progress.eta)} />{" "}
            </div>
          ) : null}
        </>
      ) : (
        <Icon icon="stopwatch" />
      )}
    </div>
  );
};

const InstallButton = React.forwardRef(
  (
    props: {
      icon: boolean;
      gameId: number;
      install: (gameId: number) => Promise<void>;
      wrapper: (el: JSX.Element) => JSX.Element;
    },
    ref: any
  ) => {
    const { gameId, icon, wrapper, install } = props;

    const onInstall = useCallback(() => {
      return install(gameId);
    }, [gameId, install]);

    if (icon) {
      return wrapper(
        <IconButton ref={ref} icon="install" onClick={onInstall} />
      );
    } else {
      return wrapper(
        <Button
          ref={ref}
          icon="install"
          label={<FormattedMessage id="grid.item.install" />}
          onClick={onInstall}
          secondary
        />
      );
    }
  }
);
