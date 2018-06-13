import React from "react";

import Games from "./games";
import GameFilters from "./game-filters";

import { MeatProps } from "renderer/components/meats/types";

import styled, * as styles from "./styles";

const LibraryContainer = styled.div`
  ${styles.meat()};
`;

class Library extends React.PureComponent<IProps> {
  render() {
    const { loading } = this.props;

    return (
      <LibraryContainer>
        <GameFilters loading={loading} />
        <Games />
      </LibraryContainer>
    );
  }
}

export default Library;

interface IProps extends MeatProps {}
