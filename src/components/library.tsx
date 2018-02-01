import * as React from "react";

import Games from "./games";
import GameFilters from "./game-filters";

import { IMeatProps } from "./meats/types";

import styled, * as styles from "./styles";

const LibraryContainer = styled.div`
  ${styles.meat()};
`;

export default class Library extends React.PureComponent<IProps> {
  render() {
    const { tab, loading } = this.props;

    return (
      <LibraryContainer>
        <GameFilters tab={tab} loading={loading} />
        <Games tab={tab} />
      </LibraryContainer>
    );
  }
}

interface IProps extends IMeatProps {}
