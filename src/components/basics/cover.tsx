import * as React from "react";
import styled, * as styles from "../styles";

import GifMarker from "./gif-marker";
import { IHoverProps } from "./hover-hoc";

import RandomSvg from "./random-svg";

const CoverDiv = styled.div`
  ${styles.defaultCoverBackground()};

  position: relative;
  padding-bottom: 80%;
  overflow: hidden;

  &:hover {
    cursor: pointer;
  }
`;

const CoverImg = styled.img`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;

  object-fit: cover;
`;

class Cover extends React.PureComponent<IProps> {
  render() {
    const {
      showGifMarker = true,
      coverUrl,
      stillCoverUrl,
      hover,
      ...restProps,
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
      <CoverDiv {...restProps}>
        {gif && showGifMarker ? <GifMarker /> : null}
        {url ? <CoverImg src={url} /> : <RandomSvg />}
      </CoverDiv>
    );
  }
}

export interface IProps extends IHoverProps {
  showGifMarker?: boolean;
  coverUrl: string;
  stillCoverUrl: string;
  onClick?: React.MouseEventHandler<HTMLDivElement>;
  onContextMenu?: React.MouseEventHandler<HTMLDivElement>;
  className?: string;
}

export default Cover;
