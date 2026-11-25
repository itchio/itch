import { RequestCreator } from "@itchio/butlerd";
import { LocalizedString } from "common/types";
import { ambientPage, ambientTab } from "common/util/navigation";
import { isNetworkError } from "main/net/errors";
import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import equal from "react-fast-compare";
import EmptyState from "renderer/basics/EmptyState";
import ErrorState from "renderer/basics/ErrorState";
import FiltersContainer from "renderer/basics/FiltersContainer";
import Floater from "renderer/basics/Floater";
import { dispatchTabPageUpdate } from "renderer/hocs/tab-utils";
import { useAppDispatch, useAppSelector } from "renderer/hooks/redux";
import { useButlerd } from "renderer/hooks/useButlerd";
import { useTab } from "renderer/hooks/useTab";
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

  type PageProps = {
    cursor: string | null;
    limit: number;
    isLast: boolean;
    /** called when this page turns out to be the end of the list */
    gotEnd: () => void;
    gotLoadMore: (loadMore: HTMLDivElement | null) => void;
    loadNextPage: (cursor: string) => void;
    sequence: number;
  } & Pick<
    Props,
    | "params"
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

    // a failed fetch has no result, that's not the end
    const atEnd = isLast && !loading && !!result && !result.nextCursor;
    useEffect(() => {
      if (atEnd) {
        props.gotEnd();
      }
    }, [atEnd]);

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

  const Series = (props: Props) => {
    const {
      label,
      renderMainFilters = renderNoop,
      renderExtraFilters = renderNoop,
      fallbackGetKey,
      getKey,
      getRecord,
      RecordComponent,
      extraProps,
    } = props;
    const tab = useTab();
    const dispatch = useAppDispatch();
    const sequence = useAppSelector((rs) => ambientTab(rs, { tab }).sequence);
    const restoredScrollTop = useAppSelector(
      (rs) => ambientPage(rs, { tab }).restoredScrollTop
    );

    // callers pass a new params object every render
    const [params, setParams] = useState(props.params);
    // the first page's cursor is always null
    const [cursors, setCursors] = useState<(string | null)[]>([null]);
    if (!equal(params, props.params)) {
      setParams(props.params);
      setCursors([null]);
    }

    const itemList = useRef<HTMLDivElement | null>(null);
    const loadMore = useRef<HTMLDivElement | null>(null);
    const lastScrollTop = useRef(0);
    const restoreScrollInterval = useRef<number | null>(null);
    const reachedEnd = useRef(false);

    const stopRestoringScroll = () => {
      if (restoreScrollInterval.current) {
        clearInterval(restoreScrollInterval.current);
        restoreScrollInterval.current = null;
      }
    };

    useEffect(() => {
      if (label) {
        dispatchTabPageUpdate({ tab, dispatch }, { label });
      }

      // items come in page by page, so keep trying until the list is tall
      // enough to reach the scroll position we had before
      if (restoredScrollTop) {
        restoreScrollInterval.current = window.setInterval(() => {
          if (itemList.current) {
            itemList.current.scrollTop = restoredScrollTop;
            if (
              itemList.current.scrollTop === restoredScrollTop ||
              // the list got shorter, this is as close as it gets
              reachedEnd.current
            ) {
              stopRestoringScroll();
            }
          }
        }, 160);
      }
      return stopRestoringScroll;
    }, []);

    const scrolledParams = useRef(params);
    useLayoutEffect(() => {
      if (scrolledParams.current === params) {
        return;
      }
      scrolledParams.current = params;
      // the saved position was for the previous params
      stopRestoringScroll();
      if (itemList.current) {
        itemList.current.scrollTop = 0;
        dispatchTabPageUpdate({ tab, dispatch }, { scrollTop: 0 });
      }
    }, [params]);

    const onScroll = useMemo(
      () =>
        throttle(() => {
          if (!itemList.current) {
            return;
          }

          const { scrollTop, scrollHeight, clientHeight } = itemList.current;
          if (scrollTop < lastScrollTop.current) {
            // scrolled up, the user has taken over
            stopRestoringScroll();
          }
          lastScrollTop.current = scrollTop;

          const runwayLeft = scrollHeight - clientHeight - scrollTop;
          if (runwayLeft < 1200 && loadMore.current) {
            loadMore.current.click();
          }

          dispatchTabPageUpdate({ tab, dispatch }, { scrollTop });
        }, 100),
      [tab, dispatch]
    );

    // these go to SeriesPage, which is memoized
    const gotEnd = useCallback(() => {
      reachedEnd.current = true;
    }, []);
    const gotLoadMore = useCallback((el: HTMLDivElement | null) => {
      loadMore.current = el;
    }, []);
    const loadNextPage = useCallback((cursor: string) => {
      setCursors((cursors) => [...cursors, cursor]);
    }, []);

    return (
      <Page>
        <FiltersContainer loading={false}>
          {renderMainFilters()}
        </FiltersContainer>
        {renderExtraFilters()}
        <ItemList
          className="series--itemlist"
          onScroll={onScroll}
          ref={itemList}
        >
          {cursors.map((cursor, i) => (
            <SeriesPage
              key={i}
              params={params}
              cursor={cursor}
              limit={limit}
              sequence={sequence}
              isLast={i === cursors.length - 1}
              gotEnd={gotEnd}
              gotLoadMore={gotLoadMore}
              loadNextPage={loadNextPage}
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
  };

  return Series;
}
