import React from "react";

import styled, * as styles from "renderer/styles";
import { MeatProps } from "renderer/scenes/HubScene/Meats/types";
import { T } from "renderer/t";
import FiltersContainer from "renderer/basics/FiltersContainer";

const LibraryContainer = styled.div`
  ${styles.meat()};
`;

class LibraryPage extends React.PureComponent<Props> {
  render() {
    return (
      <LibraryContainer>
        <FiltersContainer loading={false} />
        <h3>IAMA work in progress AMA.</h3>
        <a href="itch://library/owned">{T(["sidebar.owned"])}</a>
        <p>Fill me...</p>
        <a href="itch://library/installed">{T(["sidebar.installed"])}</a>
        <p>Fill me...</p>
      </LibraryContainer>
    );
  }
}

interface Props extends MeatProps {}

export default LibraryPage;
