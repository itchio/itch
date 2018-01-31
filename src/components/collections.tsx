import * as React from "react";
import { connect, Dispatchers, actionCreatorsList } from "./connect";

import urls from "../constants/urls";

import { FiltersContainer } from "./filters-container";

import { IMeatProps } from "./meats/types";

import CollectionsGrid from "./collections-grid/grid";
import Link from "./basics/link";
import Filler from "./basics/filler";

import styled, * as styles from "./styles";
import format from "./format";

const CollectionsContainer = styled.div`
  ${styles.meat()};
`;

export class Collections extends React.PureComponent<IProps & IDerivedProps> {
  render() {
    const { navigate } = this.props;

    return (
      <CollectionsContainer>
        <FiltersContainer>
          <Link
            label={format(["outlinks.manage_collections"])}
            onClick={e => navigate({ tab: `url/${urls.myCollections}` })}
          />
          <Filler />
        </FiltersContainer>
        <CollectionsGrid />
      </CollectionsContainer>
    );
  }
}

interface IProps extends IMeatProps {}

const actionCreators = actionCreatorsList("navigate");

type IDerivedProps = Dispatchers<typeof actionCreators>;

export default connect<IProps>(Collections, { actionCreators });
