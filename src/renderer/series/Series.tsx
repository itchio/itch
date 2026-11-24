import { RequestCreator } from "@itchio/butlerd";
import { Dispatch, LocalizedString } from "common/types";
import { ambientPage, ambientTab } from "common/util/navigation";
import { isNetworkError } from "main/net/errors";
import React from "react";
import equal from "react-fast-compare";
import EmptyState from "renderer/basics/EmptyState";
import ErrorState from "renderer/basics/ErrorState";
import FiltersContainer from "renderer/basics/FiltersContainer";
import Floater from "renderer/basics/Floater";
import { hookWithProps } from "renderer/hocs/hook";
import { dispatchTabPageUpdate } from "renderer/hocs/tab-utils";
import { withTab } from "renderer/hocs/withTab";
import { useButlerd } from "renderer/hooks/useButlerd";
import ItemList from "renderer/pages/common/ItemList";
import Page from "renderer/pages/common/Page";
import styled from "renderer/styles";
import { _ } from "renderer/t";
import { throttle } from "common/util/rate-limit";

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
  /** items without a record are skipped by renderItems */
  getRecord: (item: Item) => Record | undefined;
  getKey?: (item: Item) => any;

  renderMainFilters?: () => JSX.Element | null;
  renderExtraFilters?: () => JSX.Element | null;
}

interface GenericProps<Params, Item, Record, ExtraProps>
  extends BaseSeriesProps<Params, Item, Record> {
  fallbackGetKey: (r: Record) => any;
  RecordComponent: React.ComponentType<
    RecordComponentProps<Item, Record, ExtraProps>
  >;
  extraProps: ExtraProps;

  dispatch: Dispatch;
  tab: string;

  sequence: number;
  restoredScrollTop: number | undefined;
}

interface GenericState<Params> {
  /** the first page's cursor is always null */
  cursors: (string | null)[];
  lastParams: Params | null;
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
  font-size: ${(props) => props.theme.fontSizes.huge};
`;

interface Snapshot {
  resetScroll?: boolean;
}

const limit = 15;

export function renderNoop(): JSX.Element | null {
  return null;
}

interface NextPageButtonProps {
  cursor: string;
  // wired as a ref callback, so React calls it with null on unmount
  gotLoadMore: (el: HTMLDivElement | null) => void;
  loadNextPage: (cursor: string) => void;
}

const NextPageButton = ({
  cursor,
  gotLoadMore,
  loadNextPage,
}: NextPageButtonProps) => (
  <LoadMoreContainer ref={gotLoadMore} onClick={() => loadNextPage(cursor)}>
    <LoadMoreText>Load more...</LoadMoreText>
  </LoadMoreContainer>
);

export function makeSeries<
  Params,
  Res extends FetchRes<any>,
  Record,
  ExtraProps
>(rc: RequestCreator<Params, Res>) {
  type Item = Res["items"][0];
  type Props = GenericProps<Params, Item, Record, ExtraProps>;
  type State = GenericState<Params>;

  type PageProps = {
    cursor: string | null;
    limit: number;
    isLast: boolean;
    gotLoadMore: (loadMore: HTMLDivElement | null) => void;
    loadNextPage: (cursor: string) => void;
  } & Pick<
    Props,
    | "params"
    | "sequence"
    | "fallbackGetKey"
    | "getKey"
    | "getRecord"
    | "RecordComponent"
    | "extraProps"
  >;

  const SeriesPage = React.memo((props: PageProps) => {
    const { params, cursor, limit, sequence, isLast } = props;
    const { loading, error, result } = useButlerd(
      rc,
      { ...(params as any), cursor, limit },
      { sequence }
    );

    const items: Item[] = result?.items ?? [];

    const renderItems = () => {
      if (items.length === 0) {
        if (loading || error) {
          return null;
        }
        return (
          <EmptyState
            bigText={_("empty_state.nothing_to_see_here")}
            icon="neutral"
          />
        );
      }

      const { fallbackGetKey, getKey, getRecord, RecordComponent, extraProps } =
        props;
      const doneSet = new Set<any>();
      return items.map((item) => {
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
      });
    };

    const renderNextPage = () => {
      // while loading the cursor may belong to the previous params
      if (result?.nextCursor && isLast && !loading) {
        return (
          <NextPageButton
            cursor={result.nextCursor}
            gotLoadMore={props.gotLoadMore}
            loadNextPage={props.loadNextPage}
          />
        );
      }

      if (items.length === 0 && loading) {
        return (
          <LoadMoreContainer>
            <Floater />
          </LoadMoreContainer>
        );
      }

      return null;
    };

    return (
      <>
        {
          // a network error is not worth showing over cached items
          error && !(items.length > 0 && isNetworkError(error)) ? (
            <ErrorState error={error} />
          ) : null
        }
        {renderItems()}
        {renderNextPage()}
      </>
    );
  });

  class Series extends React.PureComponent<Props, State> {
    restoreScrollInterval: number | null = null;

    constructor(props: Props, context: any) {
      super(props, context);
      this.state = {
        cursors: [null],
        lastParams: null,
      };

      if (props.restoredScrollTop) {
        const { restoredScrollTop } = props;
        console.log(`Aiming for scrollTop ${restoredScrollTop}`);
        this.restoreScrollInterval = window.setInterval(() => {
          if (this.itemList) {
            this.itemList.scrollTop = restoredScrollTop;

            const { scrollTop } = this.itemList;
            if (scrollTop === restoredScrollTop) {
              console.log(`Done adjusting, final scrollTop = ${scrollTop}`);
              if (this.restoreScrollInterval) {
                clearInterval(this.restoreScrollInterval);
                this.restoreScrollInterval = null;
              }
            }
          }
        }, 160);
      }
    }

    override componentWillUnmount() {
      if (this.restoreScrollInterval) {
        clearInterval(this.restoreScrollInterval);
        this.restoreScrollInterval = null;
      }
    }

    static getDerivedStateFromProps(
      props: Props,
      state: State
    ): Partial<State> | null {
      if (!equal(props.params, state.lastParams)) {
        return {
          cursors: [null],
          lastParams: props.params,
        };
      }

      return null;
    }

    override getSnapshotBeforeUpdate(
      prevProps: Props,
      prevState: State
    ): Snapshot | null {
      if (!equal(this.props.params, prevProps.params)) {
        return {
          resetScroll: true,
        };
      }
      return null;
    }

    override componentDidUpdate(
      props: Props,
      state: State,
      snapshot: Snapshot | null
    ) {
      if (snapshot && snapshot.resetScroll && this.itemList) {
        console.log(`resetting scrollTop!`);
        this.itemList.scrollTop = 0;
        dispatchTabPageUpdate(this.props, { scrollTop: 0 });
      }
    }

    override componentDidMount() {
      const { label } = this.props;
      if (label) {
        dispatchTabPageUpdate(this.props, { label });
      }
    }

    override render() {
      const { params, sequence } = this.props;
      const {
        renderMainFilters = renderNoop,
        renderExtraFilters = renderNoop,
        fallbackGetKey,
        getKey,
        getRecord,
        RecordComponent,
        extraProps,
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
            ref={this.gotItemList}
          >
            {cursors.map((cursor, i) => (
              <SeriesPage
                key={i}
                params={params}
                cursor={cursor}
                limit={limit}
                sequence={sequence}
                isLast={i === cursors.length - 1}
                gotLoadMore={this.gotLoadMore}
                loadNextPage={this.loadNextPage}
                fallbackGetKey={fallbackGetKey}
                getKey={getKey}
                getRecord={getRecord}
                RecordComponent={RecordComponent}
                extraProps={extraProps}
              />
            ))}
          </ItemList>
        </Page>
      );
    }

    itemList: HTMLElement | null = null;
    gotItemList = (itemList: HTMLElement | null) => {
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

    loadMore: HTMLDivElement | null = null;
    gotLoadMore = (loadMore: HTMLDivElement | null) => {
      this.loadMore = loadMore;
    };

    loadNextPage = (cursor: string) => {
      this.setState((state) => ({
        cursors: [...state.cursors, cursor],
      }));
    };
  }
  return withTab(
    hookWithProps(Series)((map) => ({
      sequence: map((rs, props) => ambientTab(rs, props).sequence),
      restoredScrollTop: map(
        (rs, props) => ambientPage(rs, props).restoredScrollTop
      ),
    }))(Series)
  );
}
