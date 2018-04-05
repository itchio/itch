import React from "react";
import styled from "../styles";

import GifMarker from "./gif-marker";
import { IHoverProps } from "./hover-hoc";

import RandomSvg from "./random-svg";
import LoadingCircle from "./loading-circle";
import classNames from "classnames";

const CoverDiv = styled.div`
  position: relative;
  padding-bottom: 79%;
  overflow: hidden;
  background-color: rgba(255, 255, 255, 0.05);

  &.square {
    padding-bottom: 100%;
  }

  &:hover {
    cursor: pointer;
  }
`;

class Image extends React.PureComponent<IImageProps> {
  render() {
    const { onLoadStart, onLoadEnd, ...restProps } = this.props;
    return <img {...restProps} onLoad={onLoadEnd} />;
  }

  componentWillReceiveProps(nextProps: IImageProps) {
    if (nextProps.src !== this.props.src) {
      this.props.onLoadStart();
    }
  }
}

interface IImageProps {
  src?: string;
  className?: string;
  onLoadStart: () => void;
  onLoadEnd: () => void;
  onError: () => void;
}

const StyledImage = styled(Image)`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;

  object-fit: cover;

  &.error {
    visibility: hidden;
  }
`;

class Cover extends React.PureComponent<IProps, IState> {
  constructor(props: Cover["props"], context) {
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

    let gif: boolean;
    let url: string;

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
          <StyledImage
            src={url}
            onLoadStart={this.onLoadStart}
            onLoadEnd={this.onLoadEnd}
            onError={this.onError}
            className={this.state.error ? "error" : ""}
          />
        ) : (
          <RandomSvg seed={gameId} />
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

interface IState {
  loading: boolean;
  error: boolean;
}

interface IProps extends IHoverProps {
  showGifMarker?: boolean;
  coverUrl: string;
  stillCoverUrl: string;
  onClick?: React.MouseEventHandler<HTMLDivElement>;
  onContextMenu?: React.MouseEventHandler<HTMLDivElement>;
  className?: string;
  gameId: number;
  square?: boolean;
}

export default Cover;
