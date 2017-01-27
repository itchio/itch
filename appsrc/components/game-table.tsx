
import * as React from "react";
import {createStructuredSelector} from "reselect";

import {connect} from "./connect";

import {ILocalizer} from "../localizer";

import {IState, IGameRecord} from "../types";
import {IAction, dispatcher} from "../constants/action-types";
import * as actions from "../actions";

import {AutoSizer, Table, Column} from "react-virtualized";
import {IAutoSizerParams} from "./autosizer-types";

import NiceAgo from "./nice-ago";

interface IRowGetterParams {
  index: number;
}

interface ICellRendererParams {
  cellData: IGameRecord;
  columnData: any;
  dataKey: string;
  isScrolling: boolean;
  rowData: any;
  rowIndex: number;
}

interface ICellDataGetter {
  columnData: any;
  dataKey: string;
  rowData: any;
}

class GameTable extends React.Component<IGameTableProps, void> {
  constructor() {
    super();
    this.rowGetter = this.rowGetter.bind(this);
    this.coverRenderer = this.coverRenderer.bind(this);
    this.titleRenderer = this.titleRenderer.bind(this);
    this.publishedAtRenderer = this.publishedAtRenderer.bind(this);
    this.genericDataGetter = this.genericDataGetter.bind(this);
  }

  rowGetter (params: IRowGetterParams): any {
    const {index} = params;
    return this.props.games[index];
  }

  genericDataGetter (params: ICellDataGetter): any {
    return params.rowData;
  }

  coverRenderer (params: ICellRendererParams): JSX.Element | string {
    const {cellData} = params;
    return <div className="cover" style={{backgroundImage: `url("${cellData.stillCoverUrl || cellData.coverUrl}")`}}/>;
  }

  titleRenderer (params: ICellRendererParams): JSX.Element | string {
    const {cellData} = params;
    return <div className="title-column" onClick={(e) => {
        this.props.navigateToGame(cellData);
      }}>
      <div className="title">{cellData.title}</div>
      <div className="description">{cellData.shortText}</div>
    </div>;
  }

  publishedAtRenderer (params: ICellRendererParams): JSX.Element | string {
    const {cellData} = params;
    const {publishedAt} = cellData;
    if (publishedAt) {
      return <NiceAgo date={publishedAt}/>;
    } else {
      return "";
    }
  }

  render () {
    const {t, games} = this.props;

    return <div className="hub-game-table">
      <AutoSizer>
      {({width, height}: IAutoSizerParams) => {
        let remainingWidth = width;
        let coverWidth = 50;
        remainingWidth -= coverWidth;

        let publishedWidth = 150;
        remainingWidth -= publishedWidth;

        return <Table
            headerHeight={30}
            height={height}
            width={width}
            rowCount={games.length}
            rowHeight={55}
            rowGetter={this.rowGetter}
          >
          <Column
            dataKey="cover"
             width={coverWidth}
             cellDataGetter={this.genericDataGetter}
             cellRenderer={this.coverRenderer}/>
          <Column
            dataKey="title"
             label={t("table.column.name")}
             width={remainingWidth}
             cellDataGetter={this.genericDataGetter}
             cellRenderer={this.titleRenderer}/>
           <Column
             dataKey="publishedAt"
             label={t("table.column.published")}
             width={publishedWidth}
             cellDataGetter={this.genericDataGetter}
             cellRenderer={this.publishedAtRenderer}/>
        </Table>;
      }}
    </AutoSizer>
    </div>;
  }
}

interface IGameTableProps {
  // specified
  games: IGameRecord[];
  tab: string;

  filterQuery: string;
  onlyCompatible: boolean;

  t: ILocalizer;

  clearFilters: typeof actions.clearFilters;
  navigateToGame: typeof actions.navigateToGame;
}

const mapStateToProps = (initialState: IState, props: IGameTableProps) => {
  const {tab} = props;

  return createStructuredSelector({
    filterQuery: (state: IState) => state.session.navigation.filters[tab],
    onlyCompatible: (state: IState) => state.session.navigation.binaryFilters.onlyCompatible,
  });
};

const mapDispatchToProps = (dispatch: (action: IAction<any>) => void) => ({
  clearFilters: dispatcher(dispatch, actions.clearFilters),
  navigateToGame: dispatcher(dispatch, actions.navigateToGame),
});

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(GameTable);
