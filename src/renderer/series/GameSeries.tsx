import { RequestCreator } from "@itchio/butlerd";
import { Game } from "common/butlerd/messages";
import React, { useMemo } from "react";
import Filler from "renderer/basics/Filler";
import { FilterSpacer } from "renderer/pages/common/SortsAndFilters";
import StandardGameCover from "renderer/pages/common/StandardGameCover";
import StandardGameDesc from "renderer/pages/common/StandardGameDesc";
import { Box, BoxInner } from "renderer/pages/PageStyles/boxes";
import {
  BaseSeriesProps,
  FetchRes,
  makeSeries,
  RecordComponentProps,
  renderNoop,
} from "renderer/series/Series";

interface GenericExtraProps<Item> {
  renderDescExtras?: (item: Item) => JSX.Element | null;
  renderItemExtras?: (item: Item) => JSX.Element | null;
  /** hide the game's short description and classification/platforms line */
  hideGameDetails?: boolean;
  /** every game in this series is owned (e.g. owned-bundle contents) */
  forceOwned?: boolean;
  /** see openGameContextMenu's showUploadBuild */
  showUploadBuild?: boolean;
}

interface GameSeriesProps<Params, Item>
  extends BaseSeriesProps<Params, Item, Game>,
    GenericExtraProps<Item> {}

const fallbackGetKey = (g: Game) => g.id;

const GameRecord = <Item,>({
  item,
  record: game,
  renderDescExtras = renderNoop,
  renderItemExtras = renderNoop,
  hideGameDetails,
  forceOwned,
  showUploadBuild,
}: RecordComponentProps<Item, Game, GenericExtraProps<Item>>) => (
  <Box className="gameseries--box" data-game-id={game.id}>
    <BoxInner>
      <StandardGameCover
        game={game}
        forceOwned={forceOwned}
        showUploadBuild={showUploadBuild}
      />
      <FilterSpacer />
      <StandardGameDesc game={game} hideDetails={hideGameDetails}>
        {renderDescExtras(item)}
      </StandardGameDesc>
      <Filler />
      <FilterSpacer />
      {renderItemExtras(item)}
      <FilterSpacer />
    </BoxInner>
  </Box>
);

export default function makeGameSeries<Params, Res extends FetchRes<any>>(
  rc: RequestCreator<Params, Res>
) {
  type Record = Game;
  type Item = Res["items"][0];
  type ExtraProps = GenericExtraProps<Item>;
  const Series = makeSeries<Params, Res, Record, ExtraProps>(rc);
  type Props = GameSeriesProps<Params, Item>;

  const GameRecordComponent =
    React.memo<RecordComponentProps<Item, Record, ExtraProps>>(GameRecord);

  const GameSeries = (props: Props) => {
    const {
      renderDescExtras,
      renderItemExtras,
      hideGameDetails,
      forceOwned,
      showUploadBuild,
    } = props;
    // the rows are memoized on these
    const extraProps = useMemo(
      () => ({
        renderDescExtras,
        renderItemExtras,
        hideGameDetails,
        forceOwned,
        showUploadBuild,
      }),
      [
        renderDescExtras,
        renderItemExtras,
        hideGameDetails,
        forceOwned,
        showUploadBuild,
      ]
    );

    return (
      <Series
        {...props}
        fallbackGetKey={fallbackGetKey}
        RecordComponent={GameRecordComponent}
        extraProps={extraProps}
      />
    );
  };

  // identity helpers, they give callbacks defined outside of the JSX the
  // right item type
  return Object.assign(GameSeries, {
    getRecordCallback: (f: (item: Item) => Record | undefined) => f,
    getKeyCallback: (f: (item: Item) => any) => f,
    renderItemExtrasCallback: (f: (item: Item) => JSX.Element) => f,
  });
}
