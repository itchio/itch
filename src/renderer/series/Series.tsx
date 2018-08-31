import { RequestCreator } from "butlerd";
import { Dispatch, LocalizedString } from "common/types";
import { ambientPage, ambientTab } from "common/util/navigation";
import { isNetworkError } from "main/net/errors";
import React from "react";
import equal from "react-fast-compare";
import EmptyState from "renderer/basics/EmptyState";
import ErrorState from "renderer/basics/ErrorState";
import FiltersContainer from "renderer/basics/FiltersContainer";
import LoadingCircle from "renderer/basics/LoadingCircle";
import butlerCaller from "renderer/hocs/butlerCaller";
import { hookWithProps } from "renderer/hocs/hook";
import { dispatchTabPageUpdate } from "renderer/hocs/tab-utils";
import { withTab } from "renderer/hocs/withTab";
import ItemList from "renderer/pages/common/ItemList";
import Page from "renderer/pages/common/Page";
import styled from "renderer/styles";
import { isEmpty, throttle } from "underscore";

export interface FetchRes<Item> {
  items: Item[];
  nextCursor?: string;
}

export type RecordComponentProps<Item, Record, ExtraProps> = {
  item: Item;
  record: Record;
} & ExtraProps;

export interface BaseSeriesProps<Params, Item, Record> {
  label?: LocalizedString;
  params: Params;
  getRecord: (item: Item) => Record;
  getKey?: (item: Item) => any;

  renderMainFilters?: () => JSX.Element;
  renderExtraFilters?: () => JSX.Element;
}

interface GenericProps<Params, Item, Record, ExtraProps>
  extends BaseSeriesProps<Params, Item, Record> {
  fallbackGetKey?: (r: Record) => any;
  RecordComponent: React.ComponentType<
    RecordComponentProps<Item, Record, ExtraProps>
  >;
  extraProps: ExtraProps;

  dispatch: Dispatch;
  tab: string;

  sequence: number;
  restoredScrollTop: number;
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

interface Snapshot {
  resetScroll?: boolean;
}

const limit = 15;

export function makeSeries<
  Params,
  Res extends FetchRes<any>,
  Record,
  ExtraProps
>(rc: RequestCreator<Params, Res>) {
  const Call = butlerCaller(rc);

  const hasItems = (result: Res): boolean => {
    if (!result) {
      return false;
    }
    return !isEmpty(result.items);
  };

  type Item = Res["items"][0];
  type Props = GenericProps<Params, Item, Record, ExtraProps>;
  type State = GenericState<Params>;

  class Series extends React.PureComponent<Props, State> {
    restoreScrollInterval: NodeJS.Timer;

    constructor(props: Props, context: any) {
      super(props, context);
      this.state = {
        cursors: [null],
        lastParams: null,
      };

      if (props.restoredScrollTop) {
        console.log(`Aiming for scrollTop ${props.restoredScrollTop}`);
        this.restoreScrollInterval = setInterval(() => {
          if (this.itemList) {
            this.itemList.scrollTop = props.restoredScrollTop;

            const { scrollTop } = this.itemList;
            if (scrollTop === props.restoredScrollTop) {
              console.log(`Done adjusting, final scrollTop = ${scrollTop}`);
              clearInterval(this.restoreScrollInterval);
              this.restoreScrollInterval = null;
            }
          }
        }, 160);
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

    getSnapshotBeforeUpdate(prevProps: Props, prevState: State): Snapshot {
      if (!equal(this.props.params, prevProps.params)) {
        return {
          resetScroll: true,
        };
      }
      return null;
    }

    componentDidUpdate(props: Props, state: State, snapshot: Snapshot) {
      if (snapshot && snapshot.resetScroll && this.itemList) {
        console.log(`resetting scrollTop!`);
        this.itemList.scrollTop = 0;
        dispatchTabPageUpdate(this.props, { scrollTop: 0 });
      }
    }

    componentDidMount() {
      const { label } = this.props;
      if (label) {
        dispatchTabPageUpdate(this.props, { label });
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
            className="series--itemlist"
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

    lastScrollTop = 0;

    onScroll = throttle(() => {
      const { itemList } = this;
      if (!itemList) {
        return;
      }

      const { scrollTop, scrollHeight, clientHeight } = itemList;
      if (scrollTop < this.lastScrollTop) {
        if (this.restoreScrollInterval) {
          console.log(`Cancelling scroll restore (scrolled up!)`);
          clearInterval(this.restoreScrollInterval);
          this.restoreScrollInterval = null;
        }
      }
      this.lastScrollTop = scrollTop;

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
        fallbackGetKey,
        getKey,
        getRecord,
        RecordComponent,
        extraProps,
      } = this.props;

      let doneSet = new Set<any>();
      return (
        <>
          {items.map(item => {
            const record = getRecord(item);
            if (!record) {
              return null;
            }
            const key = getKey ? getKey(item) : fallbackGetKey(record);
            if (doneSet.has(key)) {
              return null;
            }
            doneSet.add(key);
            return (
              <RecordComponent
                key={key}
                item={item}
                record={record}
                {...extraProps}
              />
            );
          })}
        </>
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
}

export function renderNoop(): JSX.Element {
  return null;
}
