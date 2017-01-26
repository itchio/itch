
import * as React from "react";
import {connect} from "./connect";
import {createSelector} from "reselect";
import Fuse  = require("fuse.js");

import {sortBy} from "underscore";

import CollectionHubItem from "./collection-hub-item";

import {IState, ICollectionRecord} from "../types";
import {ILocalizer} from "../localizer";

import Dimensions = require("react-dimensions");
import {Grid} from "react-virtualized";

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

export class CollectionsGrid extends React.Component<ICollectionsGridProps, ICollectionsGridState> {
  constructor () {
    super();
    this.state = {
      scrollTop: 0,
    };
    this.cellRenderer = this.cellRenderer.bind(this);
  }

  render () {
    const {t, collections, hiddenCount} = this.props;

    const columnCount = 1;
    const rowCount = Math.ceil(collections.length / columnCount);
    const columnWidth = ((this.props.containerWidth - 10) / columnCount);
    const rowHeight = 260;

    let gridHeight = this.props.containerHeight;

    let scrollTop = this.state.scrollTop;
    if (this.props.containerHeight === 0) {
      scrollTop = 0;
    }

    return <div className="hub-collections-grid">
        <Grid
          ref="grid"
          cellRenderer={this.cellRenderer.bind(this, {collections, columnCount})}
          width={this.props.containerWidth}
          height={gridHeight}
          columnWidth={columnWidth}
          columnCount={columnCount}
          rowCount={rowCount}
          rowHeight={rowHeight}
          overscanRowCount={2}
          onScroll={(e: any) => {
            if (e.clientHeight === 0) {
              // when tab is hidden, its size is set to 0 and that resets scrollTop - ignore
              return;
            }
            this.setState({scrollTop: e.scrollTop});
          }}
          scrollTop={scrollTop}
          scrollPositionChangeReason="requested"
        />
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

interface ICollectionsGridProps {
  // derived
  collections: ICollectionRecord[];
  hiddenCount: number;

  t: ILocalizer;

  containerWidth: number;
  containerHeight: number;
}

interface ICollectionsGridState {
  scrollTop?: number;
}

const mapStateToProps = () => {
  const getCollections = (state: IState, props: ICollectionsGridProps) => state.market.collections || {};
  const getFilterQuery = (state: IState, props: ICollectionsGridProps) => state.session.navigation.filters.collections;

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
};

const mapDispatchToProps = () => ({});

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(Dimensions()(CollectionsGrid));
