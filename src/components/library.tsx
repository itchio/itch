import * as React from "react";

import Games from "./games";
import GameFilters from "./game-filters";
import TitleBar from "./title-bar";

import { IMeatProps } from "./meats/types";

import styled, * as styles from "./styles";

const LibraryContainer = styled.div`
  ${styles.meat()}
`;

export default class Library extends React.PureComponent<IProps, void> {
  render() {
    const { tab } = this.props;

    return (
      <LibraryContainer>
        <TitleBar tab={tab} />
        <GameFilters tab={tab} />
        <Games tab={tab} />
      </LibraryContainer>
    );
  }
}

interface IProps extends IMeatProps {}
