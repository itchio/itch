import React from "react";
import { Game } from "common/butlerd/messages";
import {
  makeSeries,
  BaseSeriesProps,
  FetchRes,
  RecordComponentProps,
} from "renderer/series/Series";
import { RequestCreator } from "butlerd";
import { Box, BoxInner } from "renderer/pages/PageStyles/boxes";
import { FilterSpacer } from "renderer/pages/common/SortsAndFilters";
import StandardGameDesc from "renderer/pages/common/StandardGameDesc";
import Filler from "renderer/basics/Filler";
import { createStructuredSelector } from "reselect";
import { renderNoop } from "renderer/hocs/butlerCaller";
import StandardGameCover from "renderer/pages/common/StandardGameCover";

interface GenericExtraProps<Item> {
  renderDescExtras?: (item: Item) => JSX.Element;
  renderItemExtras?: (item: Item) => JSX.Element;
}

interface GameSeriesProps<Params, Item>
  extends BaseSeriesProps<Params, Item, Game>,
    GenericExtraProps<Item> {}

let fallbackGetKey = (g: Game) => g.id;

export default function makeGameSeries<Params, Res extends FetchRes<any>>(
  rc: RequestCreator<Params, Res>
) {
  type Record = Game;
  type Item = Res["items"][0];
  type ExtraProps = GenericExtraProps<Item>;
  const Series = makeSeries<Params, Res, Record, ExtraProps>(rc);
  type Props = GameSeriesProps<Params, Item>;

  class GameRecordComponent extends GenericGameRecordComponent<Item> {}

  class GameSeries extends React.PureComponent<Props> {
    selector: (props: Props) => GenericExtraProps<Item>;

    constructor(props: Props, context: any) {
      super(props, context);
      this.selector = createStructuredSelector({
        renderDescExtras: (props) => props.renderDescExtras,
        renderItemExtras: (props) => props.renderItemExtras,
      });
    }

    render() {
      const { props } = this;
      return (
        <Series
          {...props}
          fallbackGetKey={fallbackGetKey}
          RecordComponent={GameRecordComponent}
          extraProps={this.selector(props)}
        />
      );
    }

    static getRecordCallback(f: (item: Item) => Record) {
      return f;
    }

    static getKeyCallback(f: (item: Item) => any) {
      return f;
    }

    static renderItemExtrasCallback(f: (item: Item) => JSX.Element) {
      return f;
    }
  }
  return GameSeries;
}

class GenericGameRecordComponent<Item> extends React.PureComponent<
  RecordComponentProps<Item, Game, GenericExtraProps<Item>>
> {
  render() {
    const {
      item,
      record,
      renderDescExtras = renderNoop,
      renderItemExtras = renderNoop,
    } = this.props;
    const game = record;
    return (
      <Box className="gameseries--box" data-game-id={game.id}>
        <BoxInner>
          <StandardGameCover game={game} />
          <FilterSpacer />
          <StandardGameDesc game={game}>
            {renderDescExtras(item)}
          </StandardGameDesc>
          <Filler />
          <FilterSpacer />
          {renderItemExtras(item)}
          <FilterSpacer />
        </BoxInner>
      </Box>
    );
  }
}
