import React from "react";
import { Game } from "common/butlerd/messages";
import makeSeries, {
  BaseSeriesProps,
  FetchRes,
  RecordComponentProps,
  renderNoop,
} from "renderer/pages/common/series/Series";
import { RequestCreator } from "butlerd";
import { Box, BoxInner } from "renderer/pages/PageStyles/boxes";
import { FilterSpacer } from "renderer/pages/common/SortsAndFilters";
import StandardGameDesc from "renderer/pages/common/StandardGameDesc";
import { StandardGameCover } from "renderer/pages/PageStyles/games";
import Filler from "renderer/basics/Filler";

interface ExtraProps<Item> {
  renderDescExtras?: (item: Item) => JSX.Element;
  renderItemExtras?: (item: Item) => JSX.Element;
}

interface GameSeriesProps<Params, Item>
  extends BaseSeriesProps<Params, Item, Game>,
    ExtraProps<Item> {}

let fallbackGetKey = (g: Game) => g.id;

export default function makeGameSeries<Params, Res extends FetchRes<any>>(
  rc: RequestCreator<Params, Res>
) {
  const Series = makeSeries(rc);

  type Item = Res["items"][0];
  type Props = GameSeriesProps<Params, Item>;
  class GameRecordComponent extends GenericGameRecordComponent<Item> {}

  class GameSeries extends React.PureComponent<Props> {
    render() {
      const { props } = this;
      return (
        <Series
          {...props}
          fallbackGetKey={fallbackGetKey}
          RecordComponent={GameRecordComponent}
        />
      );
    }
  }
  return GameSeries;
}

class GenericGameRecordComponent<Item> extends React.PureComponent<
  RecordComponentProps<Item, Game, ExtraProps<Item>>
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
