import { RequestCreator } from "butlerd";
import { actions } from "common/actions";
import { Game } from "common/butlerd/messages";
import { Dispatch, LocalizedString } from "common/types";
import { ambientTab, ambientWind, ambientPage } from "common/util/navigation";
import { isNetworkError } from "main/net/errors";
import React from "react";
import equal from "react-fast-compare";
import EmptyState from "renderer/basics/EmptyState";
import ErrorState from "renderer/basics/ErrorState";
import Filler from "renderer/basics/Filler";
import FiltersContainer from "renderer/basics/FiltersContainer";
import LoadingCircle from "renderer/basics/LoadingCircle";
import butlerCaller from "renderer/hocs/butlerCaller";
import { hookWithProps } from "renderer/hocs/hook";
import { dispatchTabPageUpdate } from "renderer/hocs/tab-utils";
import { withTab } from "renderer/hocs/withTab";
import ItemList from "renderer/pages/common/ItemList";
import Page from "renderer/pages/common/Page";
import { FilterSpacer } from "renderer/pages/common/SortsAndFilters";
import StandardGameDesc from "renderer/pages/common/StandardGameDesc";
import { Box, BoxInner } from "renderer/pages/PageStyles/boxes";
import { StandardGameCover } from "renderer/pages/PageStyles/games";
import styled from "renderer/styles";
import { isEmpty, throttle } from "underscore";

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
  getKey?: (item: Item) => any;
  renderDescExtras?: (item: Item) => JSX.Element;
  renderItemExtras?: (item: Item) => JSX.Element;

  dispatch: Dispatch;
  tab: string;

  sequence: number;
  restoredScrollTop: number;
}

interface GenericState<Params> {
  cursors: string[];
  lastParams: Params;
  restoringScroll: boolean;
  scrollTopTarget?: number;
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
  rc: RequestCreator<Params, Res>
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

  class Series extends React.PureComponent<Props, State> {
    restoreScrollInterval: NodeJS.Timer;

    constructor(props: Props, context: any) {
      super(props, context);
      this.state = {
        cursors: [null],
        lastParams: null,
        restoringScroll: !!props.restoredScrollTop,
        scrollTopTarget: props.restoredScrollTop,
      };

      if (props.restoredScrollTop) {
        this.restoreScrollInterval = setInterval(() => {
          if (this.itemList) {
            this.itemList.scrollTop = props.restoredScrollTop;
            const adjusted = this.itemList.scrollTop;
            if (adjusted === props.restoredScrollTop) {
              clearInterval(this.restoreScrollInterval);
            }
          }
        }, 25);
      }
    }

    componentWillUnmount() {
      if (this.restoreScrollInterval) {
        clearInterval(this.restoreScrollInterval);
        this.restoreScrollInterval = null;
      }
    }

    static getDerivedStateFromProps(
      props: Props,
      state: State
    ): Partial<State> {
      if (!equal(props.params, state.lastParams)) {
        return {
          cursors: [null],
          lastParams: props.params,
        };
      }

      return null;
    }

    componentDidUpdate(props: Props, state: State) {
      if (
        state.cursors &&
        state.cursors.length === 1 &&
        state.cursors[0] === null
      ) {
        if (this.itemList) {
          this.itemList.scrollTop = 0;
        }
      }
    }

    render() {
      const { label, params, sequence } = this.props;
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
          <ItemList
            className="gameseries--itemlist"
            onScroll={this.onScroll}
            innerRef={this.gotItemList}
          >
            {cursors.map((cursor, i) => (
              <Call
                key={i}
                errorsHandled
                loadingHandled
                params={{ ...(params as any), cursor, limit }}
                sequence={sequence}
                onResult={result => {
                  if (label) {
                    dispatchTabPageUpdate(this.props, { label });
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

      dispatchTabPageUpdate(this.props, { scrollTop });
    }, 100);

    loadMore: HTMLElement;
    gotLoadMore = (loadMore: HTMLDivElement) => {
      this.loadMore = loadMore;
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
        getKey,
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

            const key = getKey ? getKey(item) : game.id;
            if (doneSet.has(key)) {
              return null;
            }
            doneSet.add(key);
            return (
              <Box
                className="gameseries--box"
                data-game-id={game.id}
                key={key}
                // FIXME: this rerenders for no good reason
                onContextMenu={ev => {
                  ev.preventDefault();
                  this.onBoxContextMenu(ev, game);
                }}
              >
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
      return (
        <EmptyState
          bigText={["empty_state.nothing_to_see_here"]}
          icon="neutral"
        />
      );
    }
  }
  return withTab(
    hookWithProps(Series)(map => ({
      sequence: map((rs, props) => ambientTab(rs, props).sequence),
      restoredScrollTop: map(
        (rs, props) => ambientPage(rs, props).restoredScrollTop
      ),
    }))(Series)
  );
};

function renderNoop(): JSX.Element {
  return null;
}
