import classNames from "classnames";
import React, { useState, useCallback } from "react";
import GifMarker from "renderer/basics/Cover/GifMarker";
import LoadingCircle from "renderer/basics/LoadingCircle";
import withHover, { HoverProps } from "renderer/hocs/withHover";
import styled from "renderer/styles";
import SmartImage from "renderer/basics/Cover/SmartImage";
import { Game } from "common/butlerd/messages";

interface Props extends HoverProps {
  showGifMarker?: boolean;
  coverUrl?: string;
  stillCoverUrl?: string;
  onClick?: React.MouseEventHandler<HTMLDivElement>;
  onContextMenu?: React.MouseEventHandler<HTMLDivElement>;
  className?: string;
  gameId: number;
  square?: boolean;
  alt?: string;
}

const CoverDiv = styled.div`
  position: relative;
  padding-bottom: 79%;
  overflow: hidden;
  background-color: rgba(255, 255, 255, 0.05);

  &.square {
    padding-bottom: 100%;
  }
`;

const Cover = ({
  showGifMarker = true,
  coverUrl,
  stillCoverUrl,
  hover,
  square,
  className,
  alt,
  ...restProps
}: Props) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const onLoadStart = useCallback(() => setLoading(true), []);
  const onLoadEnd = useCallback(() => setLoading(false), []);
  const onError = useCallback(() => setError(true), []);

  let gif = false;
  let url: string | null = null;

  if (coverUrl) {
    if (hover) {
      url = coverUrl;
    } else {
      if (stillCoverUrl) {
        gif = true;
        url = stillCoverUrl;
      } else {
        url = coverUrl;
      }
    }
  }

  return (
    <CoverDiv {...restProps} className={classNames(className, { square })}>
      {gif && showGifMarker ? <GifMarker /> : null}
      {url ? (
        <SmartImage
          src={url}
          alt={alt}
          onLoadStart={onLoadStart}
          onLoadEnd={onLoadEnd}
          onError={onError}
          className={error ? "error" : ""}
        />
      ) : (
        <div style={{ background: "#323" }} />
      )}
      {hover && loading ? (
        <GifMarker label={<LoadingCircle progress={0.3} bare />} />
      ) : null}
    </CoverDiv>
  );
};

export default React.memo(Cover);
export const HoverCover = withHover(Cover);

export const GameCover = ({
  game,
  showGifMarker,
}: {
  game: Game;
  showGifMarker?: boolean;
}) => {
  return (
    <HoverCover
      gameId={game.id}
      coverUrl={game.coverUrl}
      stillCoverUrl={game.stillCoverUrl}
      showGifMarker={showGifMarker}
      alt={game.title}
    />
  );
};
