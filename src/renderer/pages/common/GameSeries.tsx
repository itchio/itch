import { IRequestCreator } from "butlerd";
import { actions } from "common/actions";
import { Game } from "common/butlerd/messages";
import { Space } from "common/helpers/space";
import { Dispatch, LocalizedString } from "common/types";
import { rendererWindow } from "common/util/navigation";
import React from "react";
import EmptyState from "renderer/basics/EmptyState";
import ErrorState from "renderer/basics/ErrorState";
import Filler from "renderer/basics/Filler";
import FiltersContainer from "renderer/basics/FiltersContainer";
import butlerCaller from "renderer/hocs/butlerCaller";
import { hook } from "renderer/hocs/hook";
import { withSpace } from "renderer/hocs/withSpace";
import ItemList from "renderer/pages/common/ItemList";
import Page from "renderer/pages/common/Page";
import { SortSpacer } from "renderer/pages/common/SortsAndFilters";
import StandardGameDesc from "renderer/pages/common/StandardGameDesc";
import { Box, BoxInner } from "renderer/pages/PageStyles/boxes";
import { StandardGameCover } from "renderer/pages/PageStyles/games";
import { isEmpty } from "underscore";
import { isNetworkError } from "main/net/errors";

interface FetchRes<Item> {
  items: Item[];
  nextCursor?: string;
}

interface Props<Params, Res extends FetchRes<Item>, Item> {
  label?: LocalizedString;
  params: Params;
  renderMainFilters?: () => JSX.Element;
  renderExtraFilters?: () => JSX.Element;
  getGame: (item: Item) => Game;
  renderDescExtras?: (item: Item) => JSX.Element;
  renderItemExtras?: (item: Item) => JSX.Element;

  dispatch: Dispatch;
  space: Space;
}

export default <Params, Res extends FetchRes<any>>(
  rc: IRequestCreator<Params, Res>
) => {
  const Call = butlerCaller(rc);

  const hasItems = (result: Res): boolean => {
    if (!result) {
      return false;
    }
    return !isEmpty(result.items);
  };

  const c = class extends React.PureComponent<
    Props<Params, Res, Res["items"][0]>
  > {
    render() {
      const { label, params, dispatch, space } = this.props;
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
              if (label) {
                dispatch(space.makeFetch({ label }));
              }
            }}
            render={({ result, loading, error }) => {
              return (
                <>
                  <FiltersContainer loading={loading}>
                    {renderMainFilters ? renderMainFilters() : null}
                  </FiltersContainer>
                  {renderExtraFilters ? renderExtraFilters() : null}
                  {this.renderError(result, error)}
                  <ItemList>{this.renderItems(result)}</ItemList>
                </>
              );
            }}
          />
        </Page>
      );
    }

    renderError(result: Res, error: Error) {
      if (!error) {
        return null;
      }

      if (hasItems(result) && isNetworkError(error)) {
        return null;
      }
      return <ErrorState error={error} />;
    }

    renderItems(result: Res): JSX.Element {
      if (!hasItems(result)) {
        return this.renderEmpty();
      }
      const { items } = result;

      const {
        getGame,
        renderItemExtras = renderNoop,
        renderDescExtras = renderNoop,
      } = this.props;

      let doneSet = new Set<number>();

      return (
        <>
          {items.map(item => {
            const game = getGame(item);
            if (!game) {
              return null;
            }
            if (doneSet.has(game.id)) {
              return null;
            }
            doneSet.add(game.id);
            return (
              <Box
                key={game.id}
                onContextMenu={ev => {
                  this.onBoxContextMenu(ev, game);
                }}
              >
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

    onBoxContextMenu(ev: React.MouseEvent<HTMLElement>, game: Game) {
      const { clientX, clientY } = ev;
      this.props.dispatch(
        actions.openGameContextMenu({
          window: rendererWindow(),
          clientX,
          clientY,
          game,
        })
      );
    }

    renderEmpty(): JSX.Element {
      return <EmptyState bigText="Nothing to see here" icon="neutral" />;
    }
  };

  return hook()(withSpace(c));
};

function renderNoop(): JSX.Element {
  return null;
}
