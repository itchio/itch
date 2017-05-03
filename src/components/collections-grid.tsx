
import * as React from "react";
import {connect, I18nProps} from "./connect";
import {createSelector} from "reselect";
import Fuse  = require("fuse.js");

import {sortBy} from "underscore";

import CollectionHubItem from "./collection-hub-item";

import {IAppState, ICollectionRecord} from "../types";

import {AutoSizer, Grid} from "react-virtualized";
import {IAutoSizerParams} from "./autosizer-types";

const recency = (x: ICollectionRecord) => x.updatedAt ? -(new Date(x.updatedAt)) : 0;

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

    return <div className="hub-collections-grid">
        <AutoSizer>
        {({width, height}: IAutoSizerParams) => {
          const columnCount = 1;
          const rowCount = Math.ceil(collections.length / columnCount);
          const columnWidth = ((width - 10) / columnCount);
          const rowHeight = 260;
          const scrollTop = height === 0 ? 0 : this.state.scrollTop;

          return <Grid
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
    </div>;
  }

  cellRenderer(layout: ILayoutInfo, cell: ICellInfo): JSX.Element {
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
        ? <CollectionHubItem key={record.id} collection={record}/>
        : null
      }
    </div>;
  }
}

interface IProps {}

interface IDerivedProps {
  collections: ICollectionRecord[];
  hiddenCount: number;
}

interface IState {
  scrollTop?: number;
}

export default connect<IProps>(CollectionsGrid, {
  state: () => {
    // FIXME db
    const getCollections = (state: IAppState, props: IProps) => {};
    const getFilterQuery = (state: IAppState, props: IProps) => state.session.navigation.filters.collections;

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
      (sortedCollections, filterQuery) => {
        if (filterQuery) {
          fuse.set(sortedCollections);
          const filteredCollections = fuse.search(filterQuery);
          return {
            collections: filteredCollections,
            hiddenCount: sortedCollections.length - filteredCollections.length,
          };
        } else {
          return {
            collections: sortedCollections,
            hiddenCount: 0,
          };
        }
      },
    );

    return getFilteredCollections;
  },
});
