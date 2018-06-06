import React from "react";
import { connect, Dispatchers, actionCreatorsList } from "./connect";

import urls from "common/constants/urls";

import FiltersContainer from "./filters-container";

import CollectionsGrid from "./collections-grid/grid";
import Link from "./basics/link";
import Filler from "./basics/filler";

import styled, * as styles from "./styles";
import { T } from "renderer/t";
import { IMeatProps } from "./meats/types";
import { rendererWindow } from "common/util/navigation";

const CollectionsContainer = styled.div`
  ${styles.meat()};
`;

class Collections extends React.PureComponent<IProps & IDerivedProps> {
  render() {
    const { loading, navigate } = this.props;

    return (
      <CollectionsContainer>
        <FiltersContainer loading={loading}>
          <Link
            label={T(["outlinks.manage_collections"])}
            onClick={e =>
              navigate({ window: rendererWindow(), url: urls.myCollections })
            }
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
