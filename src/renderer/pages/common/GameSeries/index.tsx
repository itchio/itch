import { IRequestCreator } from "butlerd";
import { actions } from "common/actions";
import { Game } from "common/butlerd/messages";
import { Space } from "common/helpers/space";
import { Dispatch, LocalizedString } from "common/types";
import { ambientWind } from "common/util/navigation";
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
import styled from "renderer/styles";
import * as lodash from "lodash";
import LoadingCircle from "renderer/basics/LoadingCircle";
import { throttle } from "underscore";

interface FetchRes<Item> {
  items: Item[];
  nextCursor?: string;
}

interface GenericProps<Params, Res extends FetchRes<Item>, Item> {
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

interface GenericState<Params> {
  cursors: string[];
  lastParams: Params;
}

const LoadMoreContainer = styled.div`
  height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    cursor: pointer;
  }
`;

const LoadMoreText = styled.div`
  font-size: ${props => props.theme.fontSizes.huge};
`;

const limit = 15;

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

  type Props = GenericProps<Params, Res, Res["items"][0]>;
  type State = GenericState<Params>;

  const c = class Series extends React.PureComponent<Props, State> {
    constructor(props: Props, context: any) {
      super(props, context);
      this.state = {
        cursors: [null],
        lastParams: null,
      };
    }

    static getDerivedStateFromProps(props: Props, state: State): State {
      if (!lodash.isEqual(props.params, state.lastParams)) {
        return {
          cursors: [null],
          lastParams: props.params,
        };
      }

      return null;
    }

    render() {
      const { label, params, dispatch, space } = this.props;
      const {
        renderMainFilters = renderNoop,
        renderExtraFilters = renderNoop,
      } = this.props;
      const { cursors } = this.state;

      return (
        <Page>
          <FiltersContainer loading={false}>
            {renderMainFilters ? renderMainFilters() : null}
          </FiltersContainer>
          {renderExtraFilters ? renderExtraFilters() : null}
          <ItemList onScroll={this.onScroll} innerRef={this.gotItemList}>
            {cursors.map((cursor, i) => (
              <Call
                errorsHandled
                loadingHandled
                params={{ ...(params as any), cursor, limit }}
                onResult={result => {
                  if (label) {
                    dispatch(space.makeFetch({ label }));
                  }
                }}
                render={({ result, loading, error }) => {
                  return (
                    <>
                      {this.renderError(result, error)}
                      {this.renderItems(result, loading)}
                      {result &&
                      result.nextCursor &&
                      i === cursors.length - 1 ? (
                        <LoadMoreContainer
                          innerRef={this.gotLoadMore}
                          onClick={() =>
                            this.setState({
                              cursors: [...cursors, result.nextCursor],
                            })
                          }
                        >
                          <LoadMoreText>Load more...</LoadMoreText>
                        </LoadMoreContainer>
                      ) : null}
                      {!hasItems(result) && loading ? (
                        <LoadMoreContainer>
                          <LoadingCircle progress={-1} />
                        </LoadMoreContainer>
                      ) : null}
                    </>
                  );
                }}
              />
            ))}
          </ItemList>
        </Page>
      );
    }

    itemList: HTMLElement;
    gotItemList = (itemList: HTMLElement) => {
      this.itemList = itemList;
    };

    onScroll = throttle(() => {
      const { itemList } = this;
      if (!itemList) {
        return;
      }

      const { scrollTop, scrollHeight, clientHeight } = itemList;
      const runwayLeft = scrollHeight - clientHeight - scrollTop;
      const shouldLoadMore = runwayLeft < 1200;
      const { loadMore } = this;
      if (shouldLoadMore && loadMore) {
        loadMore.click();
      }
    }, 100);

    loadMore: HTMLElement;
    gotLoadMore = (loadMore: HTMLDivElement) => {
      this.loadMore = loadMore;
      console.log(`updated loadMore: `, this.loadMore);
    };

    renderError(result: Res, error: Error) {
      if (!error) {
        return null;
      }

      if (hasItems(result) && isNetworkError(error)) {
        return null;
      }
      return <ErrorState error={error} />;
    }

    renderItems(result: Res, loading: boolean): JSX.Element {
      if (!hasItems(result)) {
        if (loading) {
          return null;
        } else {
          return this.renderEmpty();
        }
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
          wind: ambientWind(),
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
