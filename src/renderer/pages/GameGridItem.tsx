import classNames from "classnames";
import { Game, GameRecord } from "common/butlerd/messages";
import { formatDurationAsMessage } from "common/format/datetime";
import { fileSize } from "common/format/filesize";
import React from "react";
import { FormattedMessage } from "react-intl";
import { Button } from "renderer/basics/Button";
import { Icon } from "renderer/basics/Icon";
import { IconButton } from "renderer/basics/IconButton";
import { MenuTippy } from "renderer/basics/Menu";
import { ClickOutsideRefer } from "renderer/basics/useClickOutside";
import { ProgressBar } from "renderer/pages/ProgressBar";
import { InstallModalContents } from "renderer/Shell/InstallModal";
import { DownloadWithProgress } from "common/downloads";

type ClickHandler = (ev: React.MouseEvent<HTMLButtonElement>) => Promise<void>;

interface Props {
  coref: ClickOutsideRefer;
  game: GameRecord;
  launch: ClickHandler;
  install: ClickHandler;
  purchase: ClickHandler;
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
    install,
    purchase,
    launch,
    stopInstall,
    gameBeingInstalled,
  } = props;

  let wrapInTippyIfNeeded = (content: JSX.Element): JSX.Element => {
    if (gameBeingInstalled) {
      return (
        <MenuTippy
          placement="left-end"
          appendTo={document.body}
          content={
            <InstallModalContents
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
          <IconButton icon="heart-filled" onClick={purchase} />
        )}

        <InstallButton
          icon={!!game.installedAt}
          install={install}
          wrapper={wrapInTippyIfNeeded}
        />
        {game.installedAt && (
          <Button
            label={<FormattedMessage id="grid.item.launch" />}
            disabled={props.beingLaunched}
            onClick={launch}
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
      install: ClickHandler;
      wrapper: (el: JSX.Element) => JSX.Element;
    },
    ref: any
  ) => {
    const { icon, install, wrapper } = props;

    if (icon) {
      return wrapper(<IconButton ref={ref} icon="install" onClick={install} />);
    } else {
      return wrapper(
        <Button
          ref={ref}
          icon="install"
          label={<FormattedMessage id="grid.item.install" />}
          onClick={install}
          secondary
        />
      );
    }
  }
);
