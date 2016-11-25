
import * as React from "react";
import {connect} from "./connect";
import {createStructuredSelector} from "reselect";
import Fuse = require("fuse.js");

import {each, filter, uniq, map} from "underscore";

import * as actions from "../actions";

import isPlatformCompatible from "../util/is-platform-compatible";

import Icon from "./icon";
import HubItem from "./hub-item";
import HubFiller from "./hub-filler";

import {IState, IGameRecord, IFilteredGameRecord} from "../types";
import {IAction, dispatcher} from "../constants/action-types";
import {ILocalizer} from "../localizer";

import Dimensions = require("react-dimensions");
import {Grid} from "react-virtualized";

interface ICellInfo {
  columnIndex: number;
  key: string;
  rowIndex: number;
  style: React.CSSProperties;
}

class GameGrid extends React.Component<IGameGridProps, void> {
  fuse: Fuse<IGameRecord>;

  constructor () {
    super();
    this.fuse = new Fuse([], {
      keys: [
        { name: "title", weight: 0.8 },
        { name: "shortText", weight: 0.4 },
      ],
      threshold: 0.5,
      include: ["score"],
    });
    this.cellRenderer = this.cellRenderer.bind(this);
  }

  render () {
    const {t, games, filterQuery = "", onlyCompatible, tab, clearFilters} = this.props;
    const t1 = Date.now();
    this.fuse.set(games);

    const items: JSX.Element[] = [];

    let filteredGames = games as IFilteredGameRecord[];
    if (filterQuery.length > 0) {
      const results = this.fuse.search(filterQuery);
      filteredGames = map(results, ({item, score}) => Object.assign({}, item, {
        _searchScore: score,
      }));
    }
    let hiddenCount = 0;
    
    const t2 = Date.now();
    const fuseTime = t2 - t1;

    const columnCount = Math.floor(this.props.containerWidth / 300);
    const rowCount = 50;
    const totalItems = rowCount * columnCount;

    if (1 === 1) {
      return <div style={{margin: "40px", fontSize: "24px"}}>
        Size: {this.props.containerWidth}x{this.props.containerHeight}<br/>
        Fuse: {fuseTime}ms ({games.length} elements, {totalItems} show)
        <Grid
          cellRenderer={this.cellRenderer}
          width={this.props.containerWidth - 80}
          height={this.props.containerHeight - 120}
          columnWidth={(this.props.containerWidth / columnCount) - 20}
          columnCount={columnCount}
          rowCount={50}
          rowHeight={300}
        />
      </div>;
    }

    // corner case: if an invalid download key slips in, it may not be associated
    // with a game — just keep displaying it instead of breaking the whole app,
    // cf. https://itch.io/post/73405
    filteredGames = filter(filteredGames, (game) => !!game);

    // if you own a game multiple times, it might appear multiple times in the grid
    filteredGames = uniq(filteredGames, (game) => game.id);

    if (onlyCompatible) {
      filteredGames = filter(filteredGames, (game) => isPlatformCompatible(game));
    }

    hiddenCount = games.length - filteredGames.length;

    each(filteredGames, (game, index) => {
      items.push(<HubItem key={`game-${game.id}`} game={game}/>);
    });

    for (let i = 0; i < 12; i++) {
      items.push(<HubFiller key={`filler-${i}`}/>);
    }

    return <div className="hub-grid">
      {items}

      {hiddenCount > 0
      ? <div className="hidden-count">
        {t("grid.hidden_count", {count: hiddenCount})}
        {" "}
        <span className="clear-filters hint--top" data-hint={t("grid.clear_filters")}
            onClick={() => clearFilters({tab})}>
          <Icon icon="delete"/>
        </span>
      </div>
      : ""}
    </div>;
  }

  cellRenderer(info: ICellInfo): JSX.Element {
    const style = {
      position: "absolute",
      top: "10px",
      left: "10px",
      right: "10px",
      bottom: "10px",
      backgroundColor: "white",
      color: "black",
    };

    const dateString = new Date().toISOString();

    return <div key={info.key} style={info.style}>
      <div style={style}>
        {info.rowIndex}, {info.columnIndex}, {dateString}
      </div>
    </div>;
  }
}

interface IGameGridProps {
  // specified
  games: IGameRecord[];
  tab: string;

  filterQuery: string;
  onlyCompatible: boolean;

  t: ILocalizer;

  containerWidth: number;
  containerHeight: number;

  clearFilters: typeof actions.clearFilters;
}

const mapStateToProps = (initialState: IState, props: IGameGridProps) => {
  const {tab} = props;

  return createStructuredSelector({
    filterQuery: (state: IState) => state.session.navigation.filters[tab],
    onlyCompatible: (state: IState) => state.session.navigation.binaryFilters.onlyCompatible,
  });
};

const mapDispatchToProps = (dispatch: (action: IAction<any>) => void) => ({
  clearFilters: dispatcher(dispatch, actions.clearFilters),
});

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Dimensions()(GameGrid));
