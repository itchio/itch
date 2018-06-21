import { IRequestCreator } from "butlerd";
import { Game } from "common/butlerd/messages";
import React from "react";
import EmptyState from "renderer/basics/EmptyState";
import butlerCaller from "renderer/hocs/butlerCaller";
import ItemList from "renderer/pages/common/ItemList";
import Page from "renderer/pages/common/Page";
import { isEmpty } from "underscore";
import { Box, BoxInner } from "renderer/pages/PageStyles/boxes";
import { StandardGameCover } from "renderer/pages/PageStyles/games";
import StandardGameDesc from "renderer/pages/common/StandardGameDesc";
import Filler from "renderer/basics/Filler";
import FiltersContainer from "renderer/basics/FiltersContainer";
import { LocalizedString, Dispatch } from "common/types";
import { actions } from "common/actions";
import { rendererWindow } from "common/util/navigation";
import { withDispatch } from "renderer/hocs/withDispatch";
import { withTab } from "renderer/hocs/withTab";
import { SortSpacer } from "renderer/pages/common/SortsAndFilters";

interface FetchRes<Item> {
  items: Item[];
  nextCursor?: string;
}

interface Props<Params, Res extends FetchRes<Item>, Item> {
  label: LocalizedString;
  params: Params;
  renderMainFilters?: () => JSX.Element;
  renderExtraFilters?: () => JSX.Element;
  getGame: (item: Item) => Game;
  renderDescExtras?: (item: Item) => JSX.Element;
  renderItemExtras?: (item: Item) => JSX.Element;

  dispatch: Dispatch;
  tab: string;
}

export default <Params, Res extends FetchRes<any>>(
  rc: IRequestCreator<Params, Res>
) => {
  const Call = butlerCaller(rc);

  const c = class extends React.PureComponent<
    Props<Params, Res, Res["items"][0]>
  > {
    render() {
      const { label, params } = this.props;
      const {
        renderMainFilters = renderNoop,
        renderExtraFilters = renderNoop,
      } = this.props;

      return (
        <Page>
          <Call
            loadingHandled
            errorsHandled
            params={params}
            onResult={result => {
              this.props.dispatch(
                actions.tabDataFetched({
                  window: rendererWindow(),
                  tab: this.props.tab,
                  data: { label },
                })
              );
            }}
            render={({ result, loading, error }) => {
              return (
                <>
                  <FiltersContainer loading={loading}>
                    {renderMainFilters ? renderMainFilters() : null}
                  </FiltersContainer>
                  {renderExtraFilters ? renderExtraFilters() : null}
                  <ItemList>{this.renderItems(result)}</ItemList>
                </>
              );
            }}
          />
        </Page>
      );
    }

    renderItems(result: Res): JSX.Element {
      if (!result) {
        return this.renderEmpty();
      }

      const { items } = result;
      if (isEmpty(items)) {
        return this.renderEmpty();
      }

      const {
        getGame,
        renderItemExtras = renderNoop,
        renderDescExtras = renderNoop,
      } = this.props;

      return (
        <>
          {items.map(item => {
            const game = getGame(item);
            if (!game) {
              return null;
            }
            return (
              <Box key={game.id}>
                <BoxInner>
                  <StandardGameCover game={game} />
                  <SortSpacer />
                  <StandardGameDesc game={game}>
                    {renderDescExtras(item)}
                  </StandardGameDesc>
                  <Filler />
                  {renderItemExtras(item)}
                  <SortSpacer />
                </BoxInner>
              </Box>
            );
          })}
        </>
      );
    }

    renderEmpty(): JSX.Element {
      return <EmptyState bigText="Nothing to see here" icon="neutral" />;
    }
  };

  return withDispatch(withTab(c));
};

function renderNoop(): JSX.Element {
  return null;
}
