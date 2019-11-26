import classNames from "classnames";
import React from "react";
import GifMarker from "renderer/basics/Cover/GifMarker";
import LoadingCircle from "renderer/basics/LoadingCircle";
import withHover, { HoverProps } from "renderer/hocs/withHover";
import styled from "renderer/styles";
import SmartImage from "renderer/basics/Cover/SmartImage";
import { Game } from "common/butlerd/messages";

const CoverDiv = styled.div`
  position: relative;
  padding-bottom: 79%;
  overflow: hidden;
  background-color: rgba(255, 255, 255, 0.05);

  &.square {
    padding-bottom: 100%;
  }
`;

class Cover extends React.PureComponent<Props, State> {
  constructor(props: Cover["props"], context: any) {
    super(props, context);
    this.state = { loading: false, error: false };
  }

  render() {
    const {
      showGifMarker = true,
      coverUrl,
      stillCoverUrl,
      hover,
      gameId,
      square,
      className,
      ...restProps
    } = this.props;

    let gif: boolean = false;
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
            onLoadStart={this.onLoadStart}
            onLoadEnd={this.onLoadEnd}
            onError={this.onError}
            className={this.state.error ? "error" : ""}
          />
        ) : (
          <div style={{ background: "#323" }} />
        )}
        {hover && this.state.loading ? (
          <GifMarker label={<LoadingCircle progress={0.3} bare />} />
        ) : null}
      </CoverDiv>
    );
  }

  onLoadStart = () => {
    this.setState({ loading: true });
  };

  onLoadEnd = () => {
    this.setState({ loading: false });
  };

  onError = () => {
    this.setState({ error: true });
  };
}

interface State {
  loading: boolean;
  error: boolean;
}

interface Props extends HoverProps {
  showGifMarker?: boolean;
  coverUrl?: string;
  stillCoverUrl?: string;
  onClick?: React.MouseEventHandler<HTMLDivElement>;
  onContextMenu?: React.MouseEventHandler<HTMLDivElement>;
  className?: string;
  gameId: number;
  square?: boolean;
}

export default Cover;
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
    />
  );
};
