import * as React from "react";
import styled, * as styles from "../styles";

import GifMarker from "./gif-marker";
import { IHoverProps } from "./hover-hoc";

const CoverDiv = styled.div`
  ${styles.defaultCoverBackground()};
  position: relative;
  background-size: cover;
  background-position: 50% 50%;
  padding-bottom: 80%;

  &:hover {
    cursor: pointer;
  }
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
    const coverStyle: React.CSSProperties = {};
    if (coverUrl) {
      if (hover) {
        coverStyle.backgroundImage = `url('${coverUrl}')`;
      } else {
        if (stillCoverUrl) {
          gif = true;
          coverStyle.backgroundImage = `url('${stillCoverUrl}')`;
        } else {
          coverStyle.backgroundImage = `url('${coverUrl}')`;
        }
      }
    }

    return (
      <CoverDiv style={coverStyle} {...restProps}>
        {gif && showGifMarker ? <GifMarker /> : null}
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
