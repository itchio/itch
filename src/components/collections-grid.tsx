
import * as React from "react";
import {connect, I18nProps} from "./connect";
import {createSelector} from "reselect";
import Fuse  = require("fuse.js");

import {sortBy} from "underscore";

import CollectionRow from "./collection-row";
import CollectionModel from "../models/collection";

import {IAppState, ICollectionRecord, IGameRecordSet} from "../types";

import {AutoSizer, Grid} from "react-virtualized";
import {IAutoSizerParams} from "./autosizer-types";

import styled from "./styles";

const recency = (x: CollectionModel) => {
  return x.updatedAt ? -(x.updatedAt.getTime()) : 0;
};

interface ICellInfo {
  columnIndex: number;
  key: string;
  rowIndex: number;
  style: React.CSSProperties;
}

interface ILayoutInfo {
  columnCount: number;
  collections: ICollectionRecord[];
}

const tab = "collections";

const HubCollectionsGrid = styled.div`
  flex-grow: 1;
`;

const StyledGrid = styled(Grid)`
  outline: none;
`;

export class CollectionsGrid extends React.Component<IProps & IDerivedProps & I18nProps, IState> {
  constructor () {
    super();
    this.state = {
      scrollTop: 0,
    };
    this.cellRenderer = this.cellRenderer.bind(this);
  }

  render () {
    const {t, collections, hiddenCount} = this.props;

    return <HubCollectionsGrid>
        <AutoSizer>
        {({width, height}: IAutoSizerParams) => {
          const columnCount = 1;
          const rowCount = Math.ceil(collections.length / columnCount);
          const columnWidth = ((width - 10) / columnCount);
          const rowHeight = 260;
          const scrollTop = height === 0 ? 0 : this.state.scrollTop;

          return <StyledGrid
            ref="grid"
            cellRenderer={this.cellRenderer.bind(this, {collections, columnCount})}
            width={width}
            height={height}
            columnWidth={columnWidth}
            columnCount={columnCount}
            rowCount={rowCount}
            rowHeight={rowHeight}
            overscanRowCount={2}
            onScroll={(e: any) => {
              // ignore when tab's hidden
              if (e.clientHeight === 0) { return; }
              this.setState({scrollTop: e.scrollTop});
            }}
            scrollTop={scrollTop}
            scrollPositionChangeReason="requested"
          />;
        }}
        </AutoSizer>
        {hiddenCount > 0
        ? <div className="hidden-count">
          {t("grid.hidden_count", {count: hiddenCount})}
        </div>
    : ""}
    </HubCollectionsGrid>;
  }

  cellRenderer(layout: ILayoutInfo, cell: ICellInfo): JSX.Element {
    const games = this.props.games;
    const collectionIndex = (cell.rowIndex * layout.columnCount) + cell.columnIndex;
    const record = layout.collections[collectionIndex];

    const style = cell.style;
    style.padding = "10px";
    if (cell.columnIndex < layout.columnCount - 1) {
      style.marginRight = "10px";
    }

    return <div key={cell.key} style={cell.style}>
      {
        record
        ? <CollectionRow key={record.id} collection={record} allGames={games}/>
        : null
      }
    </div>;
  }
}

interface IProps {}

interface IDerivedProps {
  games: IGameRecordSet;
  collections: ICollectionRecord[];
  hiddenCount: number;
}

interface IState {
  scrollTop?: number;
}

export default connect<IProps>(CollectionsGrid, {
  state: () => {
    const getCollections = (state: IAppState, props: IProps) => (state.session.tabData[tab] || {}).collections || {};
    const getFilterQuery = (state: IAppState, props: IProps) => state.session.navigation.filters.collections;
    const getGames = (state: IAppState, props: IProps) => (state.session.tabData[tab] || {}).games || {};

    const getSortedCollections = createSelector(
      getCollections,
      (collections) => {
        return sortBy(collections, recency);
      },
    );

    const fuse = new Fuse([], {
      keys: [
        { name: "title", weight: 1.0 },
      ],
      threshold: 0.4,
    });

    const getFilteredCollections = createSelector(
      getSortedCollections,
      getFilterQuery,
      getGames,
      (sortedCollections, filterQuery, games) => {
        if (filterQuery) {
          fuse.set(sortedCollections);
          const filteredCollections = fuse.search(filterQuery);
          return {
            collections: filteredCollections,
            hiddenCount: sortedCollections.length - filteredCollections.length,
            games,
          };
        } else {
          return {
            collections: sortedCollections,
            hiddenCount: 0,
            games,
          };
        }
      },
    );

    return getFilteredCollections;
  },
});
